"""
Module: app/api/v1/eligibility.py

Standalone eligibility endpoint (re-exports the AI engine's eligibility check).
Registered under /eligibility prefix for REST discoverability.
"""

from fastapi import APIRouter, status

from app.schemas.eligibility import EligibilityCheckRequest, EligibilityCheckResponse
from app.services.eligibility_service import check_eligibility

router = APIRouter(prefix="/eligibility", tags=["Eligibility"])


@router.post(
    "/check",
    response_model=EligibilityCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Check scheme eligibility for a beneficiary profile",
    description=(
        "Deterministic rule-based eligibility check. "
        "Returns 'potentially_eligible', 'needs_verification', or 'not_eligible' "
        "per scheme with full condition breakdown. No LLM involved."
    )
)
async def check_eligibility_endpoint(payload: EligibilityCheckRequest) -> EligibilityCheckResponse:
    return check_eligibility(profile=payload.profile, scheme_ids=payload.scheme_ids)
