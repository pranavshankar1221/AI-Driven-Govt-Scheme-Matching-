"""
Module: app/ai/recommendation/scoring.py

Configurable suitability scorer for government schemes.

Scoring model (0-100):
──────────────────────────────────────────────────────────────────────
All weights are read exclusively from:
    data/config/ranking_weights.json

NEVER hard-coded in this module.

The raw score is computed as:

  score = (
      (req_passed_ratio  × w.required_conditions_passed)
    + (opt_passed_ratio  × w.optional_conditions_passed)
    + (data_complete_ratio × w.data_completeness)
    + (req_failed_count  × w.required_conditions_failed)   ← negative
    + (req_unver_count   × w.required_conditions_unverifiable) ← negative
    + (opt_failed_count  × w.optional_conditions_failed)   ← negative
    + bonus_all_passed   (if every condition passed)
    + bonus_no_missing   (if no required field was missing)
  )

  Ratios are fractions of the maximum possible for that category,
  so they scale cleanly regardless of how many conditions a scheme has.

  The final score is clamped to [score_floor, score_ceiling] (default 0-100).

DISCLAIMER — always included in every response:
  "Suitability scores are indicative only and do NOT represent official
   government eligibility determination."
──────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.ai.eligibility.evaluator import ConditionOutcome, ConditionResult, SchemeEligibilityResult
from app.ai.recommendation.weights import RankingWeights


@dataclass
class SuitabilityScore:
    """
    Computed suitability score for a single scheme.

    Attributes:
        raw_score:     Float score before clamping (may exceed 0-100 temporarily).
        final_score:   Integer score 0-100 after clamping and rounding.
        score_breakdown: Human-readable dict showing how each component contributed.
    """
    raw_score:      float
    final_score:    int
    score_breakdown: dict


def _split_conditions(
    conditions: List[ConditionResult],
) -> tuple[list, list, list, list, list, list]:
    """
    Partition condition results into:
        req_passed, req_failed, req_unverifiable,
        opt_passed, opt_failed, opt_unverifiable
    """
    req_passed = [c for c in conditions if c.required and c.outcome == ConditionOutcome.PASSED]
    req_failed = [c for c in conditions if c.required and c.outcome == ConditionOutcome.FAILED]
    req_unver  = [c for c in conditions if c.required and c.outcome == ConditionOutcome.UNVERIFIABLE]
    opt_passed = [c for c in conditions if not c.required and c.outcome == ConditionOutcome.PASSED]
    opt_failed = [c for c in conditions if not c.required and c.outcome == ConditionOutcome.FAILED]
    opt_unver  = [c for c in conditions if not c.required and c.outcome == ConditionOutcome.UNVERIFIABLE]
    return req_passed, req_failed, req_unver, opt_passed, opt_failed, opt_unver


def compute_suitability_score(
    result: SchemeEligibilityResult,
    weights: RankingWeights,
) -> SuitabilityScore:
    """
    Compute a 0-100 suitability score for a scheme given its eligibility result.

    Args:
        result:  SchemeEligibilityResult from the deterministic eligibility engine.
        weights: Loaded RankingWeights (from ranking_weights.json).

    Returns:
        SuitabilityScore with final_score, raw_score, and breakdown dict.
    """
    all_conditions = (
        result.passed_conditions
        + result.failed_conditions
        + result.unverifiable_conditions
    )

    req_passed, req_failed, req_unver, opt_passed, opt_failed, opt_unver = (
        _split_conditions(all_conditions)
    )

    total_required = len(req_passed) + len(req_failed) + len(req_unver)
    total_optional = len(opt_passed) + len(opt_failed) + len(opt_unver)

    # ── Required conditions passed ratio ──────────────────────────────
    req_pass_ratio = (len(req_passed) / total_required) if total_required else 0.0
    req_pass_component = req_pass_ratio * weights.required_conditions_passed

    # ── Optional conditions passed ratio ─────────────────────────────
    opt_pass_ratio = (len(opt_passed) / total_optional) if total_optional else 0.0
    opt_pass_component = opt_pass_ratio * weights.optional_conditions_passed

    # ── Data completeness ratio (required fields present) ─────────────
    req_present = len(req_passed) + len(req_failed)   # fields that were present
    data_ratio = (req_present / total_required) if total_required else 1.0
    data_component = data_ratio * weights.data_completeness

    # ── Penalties (per-condition, normalised by total conditions) ──────
    total_conditions = max(total_required + total_optional, 1)
    norm = 1.0 / total_conditions

    req_fail_penalty   = len(req_failed) * norm * weights.required_conditions_failed
    req_unver_penalty  = len(req_unver)  * norm * weights.required_conditions_unverifiable
    opt_fail_penalty   = len(opt_failed) * norm * weights.optional_conditions_failed

    # ── Bonuses ───────────────────────────────────────────────────────
    bonus = 0.0
    bonus_all_triggered    = False
    bonus_nomiss_triggered = False

    if (not req_failed) and (not opt_failed) and (not req_unver) and (not opt_unver):
        bonus += weights.bonus_all_conditions_passed
        bonus_all_triggered = True

    if not req_unver:
        bonus += weights.bonus_no_missing_fields
        bonus_nomiss_triggered = True

    # ── Aggregate ─────────────────────────────────────────────────────
    raw_score = (
        req_pass_component
        + opt_pass_component
        + data_component
        + req_fail_penalty
        + req_unver_penalty
        + opt_fail_penalty
        + bonus
    )

    final_score = int(
        max(weights.score_floor, min(weights.score_ceiling, round(raw_score)))
    )

    breakdown = {
        "required_passed_component":       round(req_pass_component, 2),
        "optional_passed_component":       round(opt_pass_component, 2),
        "data_completeness_component":     round(data_component, 2),
        "required_failed_penalty":         round(req_fail_penalty, 2),
        "required_unverifiable_penalty":   round(req_unver_penalty, 2),
        "optional_failed_penalty":         round(opt_fail_penalty, 2),
        "bonus_all_conditions_passed":     round(weights.bonus_all_conditions_passed, 2) if bonus_all_triggered else 0.0,
        "bonus_no_missing_fields":         round(weights.bonus_no_missing_fields, 2) if bonus_nomiss_triggered else 0.0,
        "raw_score":                       round(raw_score, 2),
        "final_score":                     final_score,
        "counts": {
            "required_passed":      len(req_passed),
            "required_failed":      len(req_failed),
            "required_unverifiable": len(req_unver),
            "optional_passed":      len(opt_passed),
            "optional_failed":      len(opt_failed),
            "optional_unverifiable": len(opt_unver),
        },
    }

    return SuitabilityScore(
        raw_score=raw_score,
        final_score=final_score,
        score_breakdown=breakdown,
    )
