"""
Module: app/services/finance_service.py

Financial calculator service.

Implements deterministic EMI calculation using the standard
reducing-balance formula. NO LLM used for calculations.

EMI = P × r × (1+r)^n / ((1+r)^n - 1)

Where:
  P = principal loan amount
  r = monthly interest rate (annual_rate / 12 / 100)
  n = number of monthly payments (tenure_years × 12)
"""

from __future__ import annotations

import math

from app.schemas.finance import EMICalculationRequest, EMICalculationResponse


def calculate_emi(request: EMICalculationRequest) -> EMICalculationResponse:
    """
    Calculate EMI and loan repayment schedule.

    Args:
        request: EMICalculationRequest with principal, rate, tenure.

    Returns:
        EMICalculationResponse with monthly EMI, total interest, total repayment.

    Raises:
        ValueError: If calculation inputs are invalid (handled by schema validation).
    """
    # Effective loan amount after subsidy deduction
    effective_loan = request.loan_amount
    if request.subsidy_amount:
        effective_loan = max(0.0, request.loan_amount - request.subsidy_amount)

    P = effective_loan
    n = int(request.tenure_years * 12)  # Convert years to months
    r = request.annual_interest_rate / 12 / 100  # Monthly rate

    if n == 0:
        raise ValueError("Tenure must result in at least 1 month.")

    # EMI calculation
    if r == 0:
        # Zero interest: simple division
        monthly_emi = round(P / n, 2)
        total_repayment = round(monthly_emi * n, 2)
        total_interest = 0.0
    else:
        factor = math.pow(1 + r, n)
        monthly_emi = round(P * r * factor / (factor - 1), 2)
        total_repayment = round(monthly_emi * n, 2)
        total_interest = round(total_repayment - P, 2)

    return EMICalculationResponse(
        loan_amount=request.loan_amount,
        annual_interest_rate=request.annual_interest_rate,
        tenure_years=request.tenure_years,
        tenure_months=n,
        monthly_interest_rate=round(r * 100, 4),
        monthly_emi=monthly_emi,
        total_interest=total_interest,
        total_repayment=total_repayment,
        applicant_contribution=request.applicant_contribution,
        subsidy_amount=request.subsidy_amount,
        effective_loan_amount=effective_loan if request.subsidy_amount else None,
    )
