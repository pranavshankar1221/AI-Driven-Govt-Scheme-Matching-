"""
Module: app/schemas/conversation.py

Pydantic schemas for conversation/session management.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.chat import BeneficiaryProfile, IntentEnum


class WorkflowState(str, Enum):
    """Tracks which step of the workflow the conversation is at."""
    START = "start"
    LANGUAGE_DETECTED = "language_detected"
    PROFILE_BUILDING = "profile_building"
    MISSING_INFO = "missing_info"
    ELIGIBILITY_CHECKED = "eligibility_checked"
    RECOMMENDATION_SHOWN = "recommendation_shown"
    EXPLANATION = "explanation"
    FINANCIAL_CALC = "financial_calc"
    DOCUMENT_GUIDANCE = "document_guidance"
    PARTNER_SEARCH = "partner_search"
    APPLICATION_GUIDANCE = "application_guidance"
    COMPLETED = "completed"
    ESCALATED = "escalated"


class ConversationMessage(BaseModel):
    """A single turn in a conversation."""
    role: str = Field(..., description="user | assistant")
    text: str
    language: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ConversationState(BaseModel):
    """Full persisted state of a conversation session."""
    conversation_id: str
    session_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    detected_language: str = "en-IN"
    language_confidence: float = 0.0
    current_intent: Optional[IntentEnum] = None
    workflow_state: WorkflowState = WorkflowState.START

    profile: BeneficiaryProfile = Field(default_factory=BeneficiaryProfile)
    missing_fields: List[str] = Field(default_factory=list)
    messages: List[ConversationMessage] = Field(default_factory=list)

    # Results from AI pipeline
    recommendations: Optional[List[Dict[str, Any]]] = None
    selected_scheme_id: Optional[str] = None
    eligibility_results: Optional[Dict[str, Any]] = None
    financial_calculation: Optional[Dict[str, Any]] = None
    partner_results: Optional[List[Dict[str, Any]]] = None
    document_guidance: Optional[Dict[str, Any]] = None

    # Context
    entities: Dict[str, Any] = Field(default_factory=dict)
    turn_count: int = 0


class ChatRequest(BaseModel):
    """Request body for the main /chat endpoint."""
    text: str = Field(..., description="User message text (any Indian language or English).")
    conversation_id: Optional[str] = Field(
        None, description="Existing conversation ID to continue a session. Leave null to start new."
    )
    language_hint: Optional[str] = Field(
        None, description="Optional BCP-47 language hint."
    )


class ChatResponse(BaseModel):
    """Response from the main /chat endpoint."""
    conversation_id: str
    session_id: str
    response_text: str = Field(..., description="AI-generated human-readable response.")
    detected_language: str
    intent: Optional[str] = None
    workflow_state: str
    profile: BeneficiaryProfile
    missing_fields: List[str] = Field(default_factory=list)
    next_question: Optional[str] = Field(
        None, description="Next clarification question if profile is incomplete."
    )
    recommendations: Optional[List[Dict[str, Any]]] = None
    financial_calculation: Optional[Dict[str, Any]] = None
    documents: Optional[Dict[str, Any]] = None
    partners: Optional[List[Dict[str, Any]]] = None
    confidence_warning: Optional[str] = Field(
        None, description="Warning if language/intent detection confidence was low."
    )
    pii_detected: bool = False
    turn_count: int


class ConversationStartResponse(BaseModel):
    """Response when starting a new conversation."""
    conversation_id: str
    session_id: str
    initial_message: str
    detected_language: str
    workflow_state: str = WorkflowState.START


class ApplicationGuidanceStep(BaseModel):
    """A single step in the application guidance."""
    step_number: int
    title: str
    description: str
    action_url: Optional[str] = None


class ApplicationGuidanceResponse(BaseModel):
    """Step-by-step application guidance for a scheme."""
    scheme_id: str
    scheme_name: str
    steps: List[ApplicationGuidanceStep]
    documents: List[str] = Field(default_factory=list)
    channel_partner: Optional[Dict[str, Any]] = None
    application_url: Optional[str] = None
    estimated_time: Optional[str] = None
    note: Optional[str] = None
