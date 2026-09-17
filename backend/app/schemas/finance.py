"""
Module: app/schemas/finance.py

Pydantic I/O schemas for the deterministic financial calculator.
NO LLM is used in financial calculations.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field, model_validator


class EMICalculationRequest(BaseModel):
    """Input for EMI / loan repayment calculation."""
    loan_amount: float = Field(
        ..., gt=0, description="Principal loan amount in INR (must be > 0)."
    )
    annual_interest_rate: float = Field(
        ..., gt=0, le=100, description="Annual interest rate as a percentage (e.g., 6.5 for 6.5%)."
    )
    tenure_years: float = Field(
        ..., gt=0, le=30, description="Loan tenure in years (e.g., 5 for 5 years)."
    )
    applicant_contribution: Optional[float] = Field(
        default=None, ge=0, description="Optional applicant self-contribution in INR."
    )
    subsidy_amount: Optional[float] = Field(
        default=None, ge=0, description="Optional government subsidy/grant amount in INR."
    )
    scheme_id: Optional[str] = Field(
        default=None, description="Optional scheme_id for context (does not affect calculation)."
    )

    @model_validator(mode="after")
    def validate_amounts(self) -> "EMICalculationRequest":
        if self.applicant_contribution and self.applicant_contribution >= self.loan_amount:
            raise ValueError("applicant_contribution must be less than loan_amount.")
        if self.subsidy_amount and self.subsidy_amount >= self.loan_amount:
            raise ValueError("subsidy_amount must be less than loan_amount.")
        return self


class EMICalculationResponse(BaseModel):
    """Structured EMI calculation result."""
    loan_amount: float = Field(..., description="Principal loan amount in INR.")
    annual_interest_rate: float = Field(..., description="Annual interest rate (%).")
    tenure_years: float = Field(..., description="Loan tenure in years.")
    tenure_months: int = Field(..., description="Loan tenure in months.")
    monthly_interest_rate: float = Field(..., description="Monthly interest rate (%).")
    monthly_emi: float = Field(..., description="Monthly EMI in INR (rounded to 2 decimal places).")
    total_interest: float = Field(..., description="Total interest paid over the loan tenure.")
    total_repayment: float = Field(..., description="Total repayment = loan_amount + total_interest.")
    applicant_contribution: Optional[float] = Field(None, description="Self-contribution amount if provided.")
    subsidy_amount: Optional[float] = Field(None, description="Subsidy/grant amount if provided.")
    effective_loan_amount: Optional[float] = Field(
        None, description="Effective loan after deducting subsidy (if subsidy provided)."
    )
    disclaimer: str = Field(
        default=(
            "EMI figures are indicative only and computed using the standard reducing-balance "
            "formula. Actual figures may vary based on lender policies and processing fees."
        )
    )
