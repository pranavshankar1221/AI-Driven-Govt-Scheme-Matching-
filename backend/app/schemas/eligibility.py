"""
Module: app/schemas/eligibility.py

Pydantic I/O schemas for the deterministic eligibility check API.
"""

from __future__ import annotations

from typing import Any, List, Optional
from pydantic import BaseModel, Field

from app.schemas.chat import BeneficiaryProfile


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class EligibilityCheckRequest(BaseModel):
    """
    Input to the eligibility engine.

    Caller provides an extracted BeneficiaryProfile plus either:
      • a specific list of scheme_ids to check, OR
      • leave scheme_ids empty to check against ALL loaded schemes.
    """
    profile: BeneficiaryProfile = Field(
        ...,
        description="Structured beneficiary profile (from /ai/profile/extract or supplied directly)."
    )
    scheme_ids: Optional[List[str]] = Field(
        default=None,
        description=(
            "Optional list of scheme IDs to evaluate against. "
            "If null or empty, all loaded schemes are evaluated."
        )
    )


# ---------------------------------------------------------------------------
# Condition-level detail
# ---------------------------------------------------------------------------

class ConditionResultSchema(BaseModel):
    """Outcome of evaluating one eligibility condition."""
    field:         str   = Field(..., description="Profile field evaluated.")
    operator:      str   = Field(..., description="Comparison operator used.")
    rule_value:    Any   = Field(..., description="Value specified in the scheme rule.")
    profile_value: Any   = Field(None, description="Value from the beneficiary profile (null if absent).")
    outcome:       str   = Field(..., description="One of: passed | failed | unverifiable.")
    description:   str   = Field(..., description="Human-readable rule description.")
    required:      bool  = Field(..., description="Whether this condition was mandatory.")


# ---------------------------------------------------------------------------
# Per-scheme result
# ---------------------------------------------------------------------------

class SchemeEligibilityResultSchema(BaseModel):
    """
    Full eligibility verdict for a single scheme.

    verdict:
      • potentially_eligible  — all required conditions passed with present data
      • not_eligible          — at least one required condition explicitly failed
      • needs_verification    — no failure but one or more required fields missing
    """
    scheme_id:   str = Field(..., description="Unique scheme identifier.")
    scheme_name: str = Field(..., description="Display name of the scheme.")
    verdict:     str = Field(
        ...,
        description="Eligibility verdict: potentially_eligible | not_eligible | needs_verification."
    )
    reason:      str = Field(..., description="Plain-English explanation of the verdict.")
    benefit_summary:  Optional[str] = Field(None, description="Brief description of scheme benefit.")
    application_url:  Optional[str] = Field(None, description="Official application portal URL.")

    # Granular condition breakdown
    passed_conditions:       List[ConditionResultSchema] = Field(
        default_factory=list,
        description="Conditions that the profile successfully satisfied."
    )
    failed_conditions:       List[ConditionResultSchema] = Field(
        default_factory=list,
        description="Conditions that the profile explicitly failed."
    )
    unverifiable_conditions: List[ConditionResultSchema] = Field(
        default_factory=list,
        description="Conditions that could not be evaluated due to missing profile fields."
    )


# ---------------------------------------------------------------------------
# Top-level response
# ---------------------------------------------------------------------------

class EligibilityCheckResponse(BaseModel):
    """
    Aggregated eligibility check response across all evaluated schemes.
    Results are sorted: potentially_eligible → needs_verification → not_eligible.
    """
    profile_used: BeneficiaryProfile = Field(
        ...,
        description="The beneficiary profile used for evaluation (echo-back for transparency)."
    )
    schemes_evaluated: int = Field(
        ...,
        description="Total number of schemes evaluated."
    )
    potentially_eligible_count: int = Field(
        ...,
        description="Schemes where the applicant appears to be eligible."
    )
    needs_verification_count: int = Field(
        ...,
        description="Schemes requiring additional profile information."
    )
    not_eligible_count: int = Field(
        ...,
        description="Schemes the applicant does not qualify for."
    )
    results: List[SchemeEligibilityResultSchema] = Field(
        ...,
        description="Per-scheme eligibility results with full condition breakdown."
    )
