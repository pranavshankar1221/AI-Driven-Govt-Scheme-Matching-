"""
Module: app/ai/agent/router.py

Intent → Workflow Router.

Maps classified IntentEnum values to the next workflow step
the orchestrator should execute.
"""

from __future__ import annotations

from app.schemas.chat import IntentEnum
from app.schemas.conversation import WorkflowState


# Maps intent → target workflow state
INTENT_TO_WORKFLOW: dict = {
    IntentEnum.SCHEME_DISCOVERY:      WorkflowState.PROFILE_BUILDING,
    IntentEnum.ELIGIBILITY_CHECK:     WorkflowState.PROFILE_BUILDING,
    IntentEnum.BUSINESS_ASSISTANCE:   WorkflowState.PROFILE_BUILDING,
    IntentEnum.EDUCATION_ASSISTANCE:  WorkflowState.PROFILE_BUILDING,
    IntentEnum.SCHEME_DETAILS:        WorkflowState.RECOMMENDATION_SHOWN,
    IntentEnum.FINANCIAL_CALCULATION: WorkflowState.FINANCIAL_CALC,
    IntentEnum.DOCUMENT_REQUIREMENTS: WorkflowState.DOCUMENT_GUIDANCE,
    IntentEnum.PARTNER_SEARCH:        WorkflowState.PARTNER_SEARCH,
    IntentEnum.APPLICATION_GUIDANCE:  WorkflowState.APPLICATION_GUIDANCE,
    IntentEnum.APPLICATION_STATUS:    WorkflowState.APPLICATION_GUIDANCE,
    IntentEnum.GENERAL_HELP:          WorkflowState.START,
    IntentEnum.HUMAN_ASSISTANCE:      WorkflowState.ESCALATED,
}


def route_intent(intent: IntentEnum) -> WorkflowState:
    """Map an intent to the next workflow state."""
    return INTENT_TO_WORKFLOW.get(intent, WorkflowState.START)
