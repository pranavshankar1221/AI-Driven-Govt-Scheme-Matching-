"""
Module: app/api/v1/ai.py

AI Engine API endpoints.

Existing endpoints (unchanged):
  POST /ai/language/detect
  POST /ai/intent
  POST /ai/profile/extract
  POST /ai/eligibility/check

New endpoints:
  POST /ai/chat              — Main conversational orchestration
  POST /ai/recommendations   — Scheme recommendation
  POST /ai/missing-fields    — Missing profile field detection
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas.chat import (
    LanguageDetectRequest, LanguageDetectResponse,
    IntentRequest, IntentResponse,
    ProfileExtractRequest, ProfileExtractResponse
)
from app.schemas.eligibility import EligibilityCheckRequest, EligibilityCheckResponse
from app.schemas.conversation import ChatRequest, ChatResponse
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.ai.nlp.language_detection import LanguageDetector
from app.ai.nlp.intent import IntentClassifier
from app.ai.nlp.profile_extractor import BeneficiaryProfileExtractor
from app.ai.nlp.missing_fields import MissingFieldDetector
from app.services.eligibility_service import check_eligibility
from app.services.recommendation_service import get_recommendations
from app.services.conversation_service import get_conversation, save_conversation
from app.ai.agent.orchestrator import AgentOrchestrator

router = APIRouter(prefix="/ai", tags=["AI Engine"])


# ── Existing Endpoints ────────────────────────────────────────────────────

@router.post(
    "/language/detect",
    response_model=LanguageDetectResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect primary language and code-mixing in user input text",
    description="Detects standard BCP-47 language codes (e.g., ta-IN, hi-IN, en-IN) and confidence scores for English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, and code-mixed Indian languages."
)
async def detect_language(payload: LanguageDetectRequest) -> LanguageDetectResponse:
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Field 'text' must not be empty.")
    lang, conf, is_mixed, script = LanguageDetector.detect(payload.text)
    return LanguageDetectResponse(language=lang, confidence=conf, is_code_mixed=is_mixed, detected_script=script)


@router.post(
    "/intent",
    response_model=IntentResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify user message intent and extract key entities",
    description="Classifies input text into one of 12 supported intents for government scheme recommendation, supporting multilingual and code-mixed Indian languages."
)
async def classify_intent(payload: IntentRequest) -> IntentResponse:
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Field 'text' must not be empty.")
    intent, conf, entities = IntentClassifier.classify(text=payload.text, language_hint=payload.language)
    return IntentResponse(intent=intent, confidence=conf, entities=entities)


@router.post(
    "/profile/extract",
    response_model=ProfileExtractResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract structured beneficiary profile with 12 fields and currency normalization",
    description="Extracts strictly defined 12 beneficiary fields (unmentioned fields are null), normalizes Indian currency expressions to integers, enforces PII redaction (Aadhaar, PAN, OTP, Bank Account), and returns Pydantic JSON."
)
async def extract_profile(payload: ProfileExtractRequest) -> ProfileExtractResponse:
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Field 'text' must not be empty.")
    return BeneficiaryProfileExtractor.extract(payload.text)


@router.post(
    "/eligibility/check",
    response_model=EligibilityCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Deterministic scheme eligibility check (no LLM)",
    description=(
        "Evaluates a structured BeneficiaryProfile against loaded scheme eligibility rules "
        "using pure operator-based logic (=, !=, <, <=, >, >=, IN, NOT_IN). "
        "Returns 'potentially_eligible', 'not_eligible', or 'needs_verification' per scheme, "
        "with exact condition-level pass/fail/unverifiable breakdown. "
        "Rules are read from JSON — never invented at runtime."
    )
)
async def check_scheme_eligibility(payload: EligibilityCheckRequest) -> EligibilityCheckResponse:
    """
    Run the deterministic eligibility engine.

    - Supply a BeneficiaryProfile (from /ai/profile/extract or directly).
    - Optionally filter by scheme_ids; leave empty to check all schemes.
    - Returns per-scheme verdicts with full condition traceability.
    """
    return check_eligibility(profile=payload.profile, scheme_ids=payload.scheme_ids)


# ── New Endpoints ─────────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Main conversational AI endpoint — full pipeline orchestration",
    description=(
        "Accepts natural language text in any Indian language. "
        "Runs the full pipeline: language detection → intent → entity extraction → "
        "profile building → eligibility check → recommendation → explanation. "
        "Pass conversation_id to continue an existing session."
    )
)
async def chat(payload: ChatRequest) -> ChatResponse:
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Field 'text' must not be empty.")

    conversation_state = None
    if payload.conversation_id:
        conversation_state = get_conversation(payload.conversation_id)
        if conversation_state is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation '{payload.conversation_id}' not found or expired."
            )

    response, updated_state = AgentOrchestrator.run(request=payload, conversation_state=conversation_state)
    save_conversation(updated_state)
    return response


@router.post(
    "/recommendations",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ranked scheme recommendations for a beneficiary profile",
    description=(
        "Evaluates all (or specified) schemes against the provided BeneficiaryProfile "
        "using the deterministic eligibility engine + suitability scorer. "
        "Returns schemes sorted by verdict priority then by suitability score (0–100)."
    )
)
async def get_scheme_recommendations(payload: RecommendationRequest) -> RecommendationResponse:
    return get_recommendations(profile=payload.profile, scheme_ids=payload.scheme_ids, top_n=payload.top_n)


@router.post(
    "/missing-fields",
    status_code=status.HTTP_200_OK,
    summary="Detect missing profile fields and get the next clarification question",
    description=(
        "Inspects the provided BeneficiaryProfile against all scheme rules and returns "
        "the list of missing required fields with a multilingual next question to ask the user. "
        "No LLM involved — purely structural + template-based."
    )
)
async def detect_missing_fields(payload: ProfileExtractRequest, language: str = "en-IN") -> dict:
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Field 'text' must not be empty.")
    extract_result = BeneficiaryProfileExtractor.extract(payload.text)
    missing_result = MissingFieldDetector.detect(profile=extract_result.profile, language=language)
    return {
        "profile": extract_result.profile.model_dump(),
        "complete": missing_result.complete,
        "missing_fields": missing_result.missing_fields,
        "next_question": missing_result.next_question,
        "next_question_field": missing_result.next_question_field,
    }
