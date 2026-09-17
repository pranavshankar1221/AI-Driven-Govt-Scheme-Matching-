"""
Module: app/api/v1/conversations.py

Conversation session management endpoints.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas.conversation import ConversationState, ConversationStartResponse
from app.services.conversation_service import (
    start_conversation, get_conversation, delete_conversation
)
from app.ai.voice.voice_prompts import VOICE_GREETINGS

router = APIRouter(prefix="/conversations", tags=["Conversation Management"])


@router.post(
    "/start",
    response_model=ConversationStartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new conversation session",
    description="Creates a new conversation session and returns IDs for subsequent /ai/chat calls."
)
async def start_new_conversation(language_hint: str = "en-IN") -> ConversationStartResponse:
    state = start_conversation(language_hint=language_hint)
    greeting = VOICE_GREETINGS.get(language_hint, VOICE_GREETINGS["en-IN"])
    return ConversationStartResponse(
        conversation_id=state.conversation_id,
        session_id=state.session_id,
        initial_message=greeting,
        detected_language=language_hint,
    )


@router.get(
    "/{conversation_id}",
    response_model=ConversationState,
    status_code=status.HTTP_200_OK,
    summary="Retrieve conversation state by ID",
    description="Returns the full conversation state including messages, profile, and recommendations."
)
async def get_conversation_state(conversation_id: str) -> ConversationState:
    state = get_conversation(conversation_id)
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found or expired."
        )
    return state


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a conversation session",
    description="Ends and deletes a conversation session by ID."
)
async def delete_conversation_endpoint(conversation_id: str) -> dict:
    deleted = delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found."
        )
    return {"deleted": True, "conversation_id": conversation_id}
