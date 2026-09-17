"""
Module: app/ai/agent/state.py

AgentSessionState — the complete state maintained across a multi-turn conversation.
Stored in ConversationState and passed through the orchestrator.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.schemas.chat import BeneficiaryProfile, IntentEnum
from app.schemas.conversation import WorkflowState


@dataclass
class AgentSessionState:
    """
    Mutable state passed through the orchestration pipeline for one session.

    This maps 1:1 to ConversationState but is a lightweight dataclass
    used internally by the orchestrator pipeline.
    """
    conversation_id: str
    session_id: str

    # Language / NLU
    detected_language: str = "en-IN"
    language_confidence: float = 0.0
    current_intent: Optional[IntentEnum] = None
    intent_confidence: float = 0.0
    entities: Dict[str, Any] = field(default_factory=dict)

    # Profile
    profile: BeneficiaryProfile = field(default_factory=BeneficiaryProfile)
    missing_fields: List[str] = field(default_factory=list)
    pii_detected: bool = False

    # Workflow
    workflow_state: WorkflowState = WorkflowState.START
    turn_count: int = 0

    # Results
    recommendations: Optional[List[Dict[str, Any]]] = None
    selected_scheme_id: Optional[str] = None
    eligibility_results: Optional[Dict[str, Any]] = None
    financial_calculation: Optional[Dict[str, Any]] = None
    partner_results: Optional[List[Dict[str, Any]]] = None
    document_guidance: Optional[Dict[str, Any]] = None

    # Response
    response_text: str = ""
    next_question: Optional[str] = None
    confidence_warning: Optional[str] = None
