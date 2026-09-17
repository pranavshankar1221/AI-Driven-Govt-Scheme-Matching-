from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class IntentEnum(str, Enum):
    SCHEME_DISCOVERY = "SCHEME_DISCOVERY"
    BUSINESS_ASSISTANCE = "BUSINESS_ASSISTANCE"
    EDUCATION_ASSISTANCE = "EDUCATION_ASSISTANCE"
    ELIGIBILITY_CHECK = "ELIGIBILITY_CHECK"
    SCHEME_DETAILS = "SCHEME_DETAILS"
    FINANCIAL_CALCULATION = "FINANCIAL_CALCULATION"
    DOCUMENT_REQUIREMENTS = "DOCUMENT_REQUIREMENTS"
    PARTNER_SEARCH = "PARTNER_SEARCH"
    APPLICATION_GUIDANCE = "APPLICATION_GUIDANCE"
    APPLICATION_STATUS = "APPLICATION_STATUS"
    GENERAL_HELP = "GENERAL_HELP"
    HUMAN_ASSISTANCE = "HUMAN_ASSISTANCE"


class LanguageDetectRequest(BaseModel):
    text: str = Field(
        ..., 
        description="The input text to analyze for language detection.",
        examples=["எனக்கு business loan வேண்டும்", "mujhe loan chahiye", "I need an agriculture scheme"]
    )


class LanguageDetectResponse(BaseModel):
    language: str = Field(
        ...,
        description="Detected BCP-47 language tag (e.g., ta-IN, hi-IN, en-IN)",
        examples=["ta-IN"]
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score of detection between 0.0 and 1.0",
        examples=[0.95]
    )
    is_code_mixed: Optional[bool] = Field(
        default=False,
        description="Flag indicating if the text contains code-mixed languages (e.g. Tamil + English)"
    )
    detected_script: Optional[str] = Field(
        default=None,
        description="Primary script detected in the text"
    )


class IntentRequest(BaseModel):
    text: str = Field(
        ...,
        description="The user's message to classify for intent.",
        examples=["எனக்கு business loan வேண்டும் 500000", "Am I eligible for PM Kisan scheme?"]
    )
    language: Optional[str] = Field(
        default=None,
        description="Optional detected language code (e.g., ta-IN, hi-IN, en-IN)",
        examples=["ta-IN"]
    )


class IntentResponse(BaseModel):
    intent: IntentEnum = Field(
        ...,
        description="Classified intent from one of the 12 supported intents.",
        examples=[IntentEnum.BUSINESS_ASSISTANCE]
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score of the intent classification.",
        examples=[0.95]
    )
    entities: Dict[str, Any] = Field(
        default_factory=dict,
        description="Extracted key entities (e.g. category, amount, scheme_name, location).",
        examples=[{"category": "business_loan", "amount": "500000"}]
    )


class BeneficiaryProfile(BaseModel):
    age: Optional[int] = Field(default=None, description="Age in years (e.g. 28)")
    gender: Optional[str] = Field(default=None, description="Gender (male, female, other)")
    state: Optional[str] = Field(default=None, description="Indian State (e.g. Tamil Nadu, Maharashtra)")
    district: Optional[str] = Field(default=None, description="District (e.g. Salem, Pune)")
    annual_income: Optional[int] = Field(default=None, description="Annual income in INR (e.g. 300000)")
    category: Optional[str] = Field(default=None, description="Social Category (General, OBC, SC, ST)")
    education: Optional[str] = Field(default=None, description="Education level (e.g. Graduate, 10th Pass)")
    occupation: Optional[str] = Field(default=None, description="Occupation (e.g. farmer, weaver, entrepreneur)")
    purpose: Optional[str] = Field(default=None, description="Purpose for scheme/loan assistance")
    activity: Optional[str] = Field(default=None, description="Business or farming activity")
    project_cost: Optional[int] = Field(default=None, description="Project cost in INR (e.g. 500000)")
    loan_required: Optional[int] = Field(default=None, description="Loan amount required in INR (e.g. 400000)")


class ProfileExtractRequest(BaseModel):
    text: str = Field(
        ...,
        description="Input user message describing beneficiary details.",
        examples=["I am a 28 year old female from Salem Tamil Nadu. Income 3 lakhs per year. Want 4 lakh loan for dairy farming."]
    )


class ProfileExtractResponse(BaseModel):
    profile: BeneficiaryProfile = Field(
        ...,
        description="Extracted beneficiary profile containing 12 fields (unmentioned fields are null)."
    )
    pii_detected: bool = Field(
        default=False,
        description="Flag indicating if sensitive PII (Aadhaar, PAN, OTP, Bank Account) was detected and redacted."
    )
