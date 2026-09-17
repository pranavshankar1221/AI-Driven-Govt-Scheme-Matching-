"""
Module: app/services/conversation_service.py

Conversation session management service.

Provides in-memory session storage with timeout support.
Replace the _store dict with Redis/database for production multi-instance deployment.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional

from app.schemas.conversation import ConversationState, WorkflowState
from app.core.config import settings


# In-memory session store (process-local)
# Key: conversation_id → ConversationState
_store: Dict[str, ConversationState] = {}


def start_conversation(language_hint: Optional[str] = None) -> ConversationState:
    """
    Start a new conversation session.

    Args:
        language_hint: Optional preferred language.

    Returns:
        New ConversationState with unique IDs.
    """
    conversation_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    state = ConversationState(
        conversation_id=conversation_id,
        session_id=session_id,
        detected_language=language_hint or settings.DEFAULT_LANGUAGE,
    )
    _store[conversation_id] = state
    return state


def get_conversation(conversation_id: str) -> Optional[ConversationState]:
    """
    Retrieve an existing conversation by ID.

    Args:
        conversation_id: UUID string.

    Returns:
        ConversationState or None if not found or expired.
    """
    state = _store.get(conversation_id)
    if state is None:
        return None

    # Check session timeout
    elapsed = (datetime.utcnow() - state.updated_at).total_seconds()
    if elapsed > settings.SESSION_TIMEOUT_SECONDS:
        _store.pop(conversation_id, None)
        return None

    return state


def save_conversation(state: ConversationState) -> None:
    """
    Save (upsert) a conversation state.

    Args:
        state: Updated ConversationState.
    """
    state.updated_at = datetime.utcnow()
    _store[state.conversation_id] = state


def delete_conversation(conversation_id: str) -> bool:
    """
    Delete a conversation session.

    Args:
        conversation_id: UUID string.

    Returns:
        True if deleted, False if not found.
    """
    if conversation_id in _store:
        _store.pop(conversation_id)
        return True
    return False


def get_active_session_count() -> int:
    """Return the number of active (non-expired) sessions."""
    now = datetime.utcnow()
    timeout = settings.SESSION_TIMEOUT_SECONDS
    return sum(
        1 for s in _store.values()
        if (now - s.updated_at).total_seconds() <= timeout
    )
