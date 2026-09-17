"""
Module: app/ai/eligibility/evaluator.py

Deterministic eligibility evaluator.

Decision logic (NO LLM):
───────────────────────────────────────────────────────────────────────
For each scheme the engine evaluates every EligibilityCondition in order:

  1. If a required=True condition's profile field is MISSING:
       → marks the condition as UNVERIFIABLE (contributes to needs_verification)

  2. If a required=True condition FAILS (field present but value fails operator):
       → marks as FAILED → scheme result = not_eligible (short-circuit)

  3. If a required=False condition's field is missing:
       → marks as UNVERIFIABLE (soft flag only, does NOT disqualify)

  4. If ALL required conditions PASS and NO required fields are missing:
       → scheme result = potentially_eligible

  5. If ALL required conditions PASS but SOME required fields were missing:
       → scheme result = needs_verification

Final verdict per scheme:
  • not_eligible        – At least one required condition explicitly failed.
  • needs_verification  – No explicit failure but one or more required fields
                         were absent; cannot confirm eligibility without more info.
  • potentially_eligible – Every required condition passed with full data.
───────────────────────────────────────────────────────────────────────

IMPORTANT: Rules are ONLY read from SchemeEligibilityRules objects that
were loaded from structured JSON/database. The engine never invents rules.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional

from app.schemas.chat import BeneficiaryProfile
from app.ai.eligibility.conditions import (
    ConditionEvaluationError,
    evaluate_condition,
)
from app.ai.eligibility.rules import EligibilityCondition, SchemeEligibilityRules
from app.ai.eligibility.validator import get_profile_value


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

class EligibilityVerdict(str, Enum):
    POTENTIALLY_ELIGIBLE = "potentially_eligible"
    NOT_ELIGIBLE         = "not_eligible"
    NEEDS_VERIFICATION   = "needs_verification"


class ConditionOutcome(str, Enum):
    PASSED        = "passed"
    FAILED        = "failed"
    UNVERIFIABLE  = "unverifiable"   # field absent; cannot evaluate


@dataclass
class ConditionResult:
    """Outcome of evaluating a single EligibilityCondition."""
    field:        str
    operator:     str
    rule_value:   object
    profile_value: object          # None if absent
    outcome:      ConditionOutcome
    description:  str
    required:     bool

    def to_dict(self) -> dict:
        return {
            "field":         self.field,
            "operator":      self.operator,
            "rule_value":    self.rule_value,
            "profile_value": self.profile_value,
            "outcome":       self.outcome.value,
            "description":   self.description,
            "required":      self.required,
        }


@dataclass
class SchemeEligibilityResult:
    """Eligibility verdict for one scheme against one beneficiary profile."""
    scheme_id:    str
    scheme_name:  str
    verdict:      EligibilityVerdict

    # Granular condition outcomes
    passed_conditions:         List[ConditionResult] = field(default_factory=list)
    failed_conditions:         List[ConditionResult] = field(default_factory=list)
    unverifiable_conditions:   List[ConditionResult] = field(default_factory=list)

    # Human-readable summary
    reason:       str = ""
    benefit_summary:  Optional[str] = None
    application_url:  Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "scheme_id":   self.scheme_id,
            "scheme_name": self.scheme_name,
            "verdict":     self.verdict.value,
            "reason":      self.reason,
            "benefit_summary": self.benefit_summary,
            "application_url": self.application_url,
            "passed_conditions":       [c.to_dict() for c in self.passed_conditions],
            "failed_conditions":       [c.to_dict() for c in self.failed_conditions],
            "unverifiable_conditions": [c.to_dict() for c in self.unverifiable_conditions],
        }


# ---------------------------------------------------------------------------
# Core engine
# ---------------------------------------------------------------------------

class EligibilityEngine:
    """
    Deterministic eligibility engine.

    This class evaluates a BeneficiaryProfile against SchemeEligibilityRules
    using pure Python operator logic. No LLM call is made here.
    """

    # ------------------------------------------------------------------
    # Single scheme evaluation
    # ------------------------------------------------------------------

    @classmethod
    def evaluate_scheme(
        cls,
        profile: BeneficiaryProfile,
        scheme_rules: SchemeEligibilityRules,
    ) -> SchemeEligibilityResult:
        """
        Evaluate a beneficiary profile against one scheme's rules.

        Returns a SchemeEligibilityResult with the verdict and full
        condition-level detail (which rules passed, failed, or were
        unverifiable due to missing data).
        """
        passed:       List[ConditionResult] = []
        failed:       List[ConditionResult] = []
        unverifiable: List[ConditionResult] = []

        for condition in scheme_rules.conditions:
            profile_val = get_profile_value(profile, condition.field)

            # ── Field is absent in profile ─────────────────────────────
            if profile_val is None:
                cr = ConditionResult(
                    field=condition.field,
                    operator=condition.operator.value,
                    rule_value=condition.value,
                    profile_value=None,
                    outcome=ConditionOutcome.UNVERIFIABLE,
                    description=condition.description,
                    required=condition.required,
                )
                unverifiable.append(cr)
                continue

            # ── Evaluate condition deterministically ───────────────────
            try:
                passes = evaluate_condition(
                    profile_val=profile_val,
                    operator=condition.operator.value,
                    rule_val=condition.value,
                )
            except ConditionEvaluationError as exc:
                # Type mismatch → treat as unverifiable, not a hard failure
                cr = ConditionResult(
                    field=condition.field,
                    operator=condition.operator.value,
                    rule_value=condition.value,
                    profile_value=profile_val,
                    outcome=ConditionOutcome.UNVERIFIABLE,
                    description=f"{condition.description} [evaluation error: {exc}]",
                    required=condition.required,
                )
                unverifiable.append(cr)
                continue

            outcome = ConditionOutcome.PASSED if passes else ConditionOutcome.FAILED
            cr = ConditionResult(
                field=condition.field,
                operator=condition.operator.value,
                rule_value=condition.value,
                profile_value=profile_val,
                outcome=outcome,
                description=condition.description,
                required=condition.required,
            )
            if passes:
                passed.append(cr)
            else:
                failed.append(cr)

        # ── Determine verdict ──────────────────────────────────────────
        verdict, reason = cls._determine_verdict(passed, failed, unverifiable)

        return SchemeEligibilityResult(
            scheme_id=scheme_rules.scheme_id,
            scheme_name=scheme_rules.scheme_name,
            verdict=verdict,
            passed_conditions=passed,
            failed_conditions=failed,
            unverifiable_conditions=unverifiable,
            reason=reason,
            benefit_summary=scheme_rules.benefit_summary,
            application_url=scheme_rules.application_url,
        )

    # ------------------------------------------------------------------
    # Multi-scheme bulk evaluation
    # ------------------------------------------------------------------

    @classmethod
    def evaluate_all(
        cls,
        profile: BeneficiaryProfile,
        scheme_rules_list: List[SchemeEligibilityRules],
    ) -> List[SchemeEligibilityResult]:
        """
        Evaluate a profile against a list of schemes.

        Results are sorted:
            1. potentially_eligible (best match first)
            2. needs_verification
            3. not_eligible
        """
        results = [
            cls.evaluate_scheme(profile, rules)
            for rules in scheme_rules_list
        ]

        order = {
            EligibilityVerdict.POTENTIALLY_ELIGIBLE: 0,
            EligibilityVerdict.NEEDS_VERIFICATION:   1,
            EligibilityVerdict.NOT_ELIGIBLE:         2,
        }
        results.sort(key=lambda r: order[r.verdict])
        return results

    # ------------------------------------------------------------------
    # Verdict determination
    # ------------------------------------------------------------------

    @staticmethod
    def _determine_verdict(
        passed:       List[ConditionResult],
        failed:       List[ConditionResult],
        unverifiable: List[ConditionResult],
    ) -> tuple[EligibilityVerdict, str]:
        """
        Pure logic verdict determination based on condition outcomes.

        Rules (in priority order):
        1. Any required condition FAILED       → not_eligible
        2. Any required condition UNVERIFIABLE → needs_verification
        3. Otherwise                           → potentially_eligible
        """
        required_failed = [c for c in failed if c.required]
        required_unverifiable = [c for c in unverifiable if c.required]

        if required_failed:
            fields = ", ".join(c.field for c in required_failed)
            return (
                EligibilityVerdict.NOT_ELIGIBLE,
                f"Did not meet required criteria for: {fields}. "
                + "; ".join(
                    f"'{c.field}' must be {c.operator} {c.rule_value!r} "
                    f"(got {c.profile_value!r})"
                    for c in required_failed
                ),
            )

        if required_unverifiable:
            fields = ", ".join(c.field for c in required_unverifiable)
            return (
                EligibilityVerdict.NEEDS_VERIFICATION,
                f"Cannot confirm eligibility — missing required profile fields: {fields}. "
                "Please provide these details to get a definitive answer.",
            )

        passed_count = len(passed)
        return (
            EligibilityVerdict.POTENTIALLY_ELIGIBLE,
            f"All {passed_count} required condition(s) passed. "
            "This applicant appears to be eligible; subject to document verification.",
        )
