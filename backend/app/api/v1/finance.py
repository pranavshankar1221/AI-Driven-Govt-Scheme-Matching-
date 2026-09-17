"""
Module: app/api/v1/finance.py

Financial calculator endpoint.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas.finance import EMICalculationRequest, EMICalculationResponse
from app.services.finance_service import calculate_emi

router = APIRouter(prefix="/finance", tags=["Financial Calculator"])


@router.post(
    "/calculate",
    response_model=EMICalculationResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate EMI and loan repayment schedule",
    description=(
        "Deterministic EMI calculation using the standard reducing-balance formula. "
        "Supports applicant contribution and government subsidy deduction. "
        "Returns monthly EMI, total interest, and total repayment. No LLM."
    )
)
async def calculate_emi_endpoint(payload: EMICalculationRequest) -> EMICalculationResponse:
    try:
        return calculate_emi(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
