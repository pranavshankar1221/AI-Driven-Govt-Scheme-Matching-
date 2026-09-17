"""
Module: app/schemas/recommendation.py

Pydantic I/O schemas for the scheme recommendation engine.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from app.schemas.chat import BeneficiaryProfile


class RecommendationRequest(BaseModel):
    """Input for scheme recommendation."""
    profile: BeneficiaryProfile = Field(
        ..., description="Extracted beneficiary profile."
    )
    scheme_ids: Optional[List[str]] = Field(
        None, description="Optional list of scheme_ids to evaluate. Evaluates all if not provided."
    )
    language: Optional[str] = Field(
        None, description="Preferred language for response (BCP-47)."
    )
    top_n: Optional[int] = Field(
        None, ge=1, le=20, description="Return only top N results."
    )


class RankedScheme(BaseModel):
    """A single ranked scheme recommendation."""
    scheme_id: str
    scheme_name: str
    ministry: Optional[str] = None
    description: Optional[str] = None
    verdict: str = Field(
        ..., description="potentially_eligible | needs_verification | not_eligible"
    )
    suitability_score: int = Field(..., ge=0, le=100)
    score_breakdown: Dict[str, Any] = Field(default_factory=dict)
    reason: str
    benefit_summary: Optional[str] = None
    application_url: Optional[str] = None
    missing_fields: List[str] = Field(
        default_factory=list,
        description="Profile fields missing that would improve this scheme's verdict."
    )


class RecommendationResponse(BaseModel):
    """Ranked scheme recommendation response."""
    profile_used: BeneficiaryProfile
    schemes_evaluated: int
    potentially_eligible_count: int
    needs_verification_count: int
    not_eligible_count: int
    ranked_schemes: List[RankedScheme]
    disclaimer: str = Field(
        default=(
            "Suitability scores are indicative only and do NOT represent official "
            "government eligibility determination. Final eligibility is subject to "
            "document verification by the relevant authority."
        )
    )
