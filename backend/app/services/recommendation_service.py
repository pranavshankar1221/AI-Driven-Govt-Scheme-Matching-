"""
Module: app/services/recommendation_service.py

Recommendation service — wires matcher + ranker into a single call.
"""

from __future__ import annotations

from typing import List, Optional

from app.schemas.chat import BeneficiaryProfile
from app.schemas.recommendation import RankedScheme, RecommendationRequest, RecommendationResponse
from app.ai.recommendation.matcher import SchemeMatcher
from app.ai.recommendation.ranker import SchemeRanker
from app.ai.eligibility.evaluator import EligibilityVerdict


def get_recommendations(
    profile: BeneficiaryProfile,
    scheme_ids: Optional[List[str]] = None,
    top_n: Optional[int] = None,
) -> RecommendationResponse:
    """
    Get ranked scheme recommendations for a beneficiary profile.

    Args:
        profile:    Beneficiary profile.
        scheme_ids: Optional filter to specific scheme IDs.
        top_n:      Optional cap on results.

    Returns:
        RecommendationResponse with ranked schemes and aggregate counts.
    """
    matched = SchemeMatcher.match(profile=profile, scheme_ids=scheme_ids)
    ranked = SchemeRanker.rank(matched, top_n=top_n)

    pe_count = sum(1 for s in ranked if s.verdict == EligibilityVerdict.POTENTIALLY_ELIGIBLE)
    nv_count = sum(1 for s in ranked if s.verdict == EligibilityVerdict.NEEDS_VERIFICATION)
    ne_count = sum(1 for s in ranked if s.verdict == EligibilityVerdict.NOT_ELIGIBLE)

    return RecommendationResponse(
        profile_used=profile,
        schemes_evaluated=len(ranked),
        potentially_eligible_count=pe_count,
        needs_verification_count=nv_count,
        not_eligible_count=ne_count,
        ranked_schemes=ranked,
    )
