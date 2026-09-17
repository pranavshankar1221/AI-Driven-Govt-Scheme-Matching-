"""
Module: app/ai/recommendation/matcher.py

SchemeMatcher: runs the eligibility engine + suitability scorer
to produce a ranked list of schemes for a given beneficiary profile.

Reuses:
- EligibilityEngine.evaluate_all
- compute_suitability_score
- load_ranking_weights
"""

from __future__ import annotations

from typing import List, Optional

from app.schemas.chat import BeneficiaryProfile
from app.schemas.recommendation import RankedScheme
from app.ai.eligibility.evaluator import EligibilityEngine, SchemeEligibilityResult
from app.ai.eligibility.rules import SchemeEligibilityRules
from app.ai.recommendation.scoring import compute_suitability_score
from app.ai.recommendation.weights import load_ranking_weights
from app.services.eligibility_service import get_registry


class SchemeMatcher:
    """
    Matches a BeneficiaryProfile to all (or specified) schemes.

    Pipeline:
        1. Load scheme rules from registry
        2. Run EligibilityEngine.evaluate_all (deterministic, no LLM)
        3. Compute suitability score per scheme
        4. Return list of RankedScheme (unsorted — use SchemeRanker to sort)
    """

    @classmethod
    def match(
        cls,
        profile: BeneficiaryProfile,
        scheme_ids: Optional[List[str]] = None,
    ) -> List[RankedScheme]:
        """
        Match profile against schemes and return scored results.

        Args:
            profile:    Extracted beneficiary profile.
            scheme_ids: Optional list of scheme IDs to filter.

        Returns:
            List of RankedScheme (may be unsorted).
        """
        registry = get_registry()
        weights = load_ranking_weights()

        # Resolve which schemes to evaluate
        if scheme_ids:
            rules_list: List[SchemeEligibilityRules] = [
                r for sid in scheme_ids
                if (r := registry.get(sid)) is not None
            ]
        else:
            rules_list = registry.all()

        if not rules_list:
            return []

        # Run deterministic eligibility engine
        engine_results: List[SchemeEligibilityResult] = EligibilityEngine.evaluate_all(
            profile=profile,
            scheme_rules_list=rules_list,
        )

        # Score and convert to RankedScheme
        ranked: List[RankedScheme] = []
        for er in engine_results:
            score = compute_suitability_score(er, weights)

            # Collect missing required fields for this scheme
            missing_fields = [c.field for c in er.unverifiable_conditions if c.required]

            # Get scheme metadata from rules
            scheme_rules = registry.get(er.scheme_id)
            ministry = scheme_rules.ministry if scheme_rules else None
            description = scheme_rules.description if scheme_rules else None

            ranked.append(RankedScheme(
                scheme_id=er.scheme_id,
                scheme_name=er.scheme_name,
                ministry=ministry,
                description=description,
                verdict=er.verdict.value,
                suitability_score=score.final_score,
                score_breakdown=score.score_breakdown,
                reason=er.reason,
                benefit_summary=er.benefit_summary,
                application_url=er.application_url,
                missing_fields=missing_fields,
            ))

        return ranked
