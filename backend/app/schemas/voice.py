"""
Module: app/schemas/voice.py

Pydantic schemas for the Live AI Voice Call WebSocket system.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.chat import BeneficiaryProfile
from app.schemas.recommendation import RankedScheme


class VoiceState(str, Enum):
    """State of the voice call pipeline."""
    CONNECTING = "connecting"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    INTERRUPTED = "interrupted"
    ERROR = "error"
    COMPLETED = "completed"


class VoiceErrorCode(str, Enum):
    STT_ERROR = "STT_ERROR"
    TTS_ERROR = "TTS_ERROR"
    LLM_ERROR = "LLM_ERROR"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    INVALID_AUDIO = "INVALID_AUDIO"
    PROVIDER_TIMEOUT = "PROVIDER_TIMEOUT"
    INTERNAL_ERROR = "INTERNAL_ERROR"


# ── WebSocket Event Models ──────────────────────────────────────────────────

class WSTranscriptEvent(BaseModel):
    """Transcript message sent from server to client."""
    type: str = "transcript"
    role: str = Field(..., description="user | ai")
    text: str
    time: str = Field(..., description="Elapsed time string (e.g., '0:08').")
    language: Optional[str] = None
    confidence: Optional[float] = None


class WSStateChangeEvent(BaseModel):
    """State change notification from server to client."""
    type: str = "state_change"
    state: VoiceState
    message: Optional[str] = None


class WSErrorEvent(BaseModel):
    """Error notification from server to client. Never exposes API keys or stack traces."""
    type: str = "error"
    code: VoiceErrorCode
    message: str
    recoverable: bool = True


class WSBargeInEvent(BaseModel):
    """Client → Server: user wants to interrupt AI speech."""
    type: str = "barge_in"


class WSPingEvent(BaseModel):
    """Client → Server: keep-alive ping."""
    type: str = "ping"


class WSPongEvent(BaseModel):
    """Server → Client: keep-alive pong."""
    type: str = "pong"


# ── HTTP Session Control ──────────────────────────────────────────────────

class VoiceSessionStartRequest(BaseModel):
    """POST /api/v1/voice/session/start"""
    user_profile: Optional[BeneficiaryProfile] = Field(
        None, description="Optional pre-collected profile from prior text conversation."
    )
    page_context: Optional[Dict[str, Any]] = Field(
        None, description="Frontend context (e.g., currently viewed scheme)."
    )
    language_preference: Optional[str] = Field(
        None, description="Preferred language or mix (e.g., 'Tamil + English', 'ta-IN')."
    )
    conversation_id: Optional[str] = Field(
        None, description="Link to an existing text conversation for session continuity."
    )


class VoiceSessionStartResponse(BaseModel):
    """Response to POST /api/v1/voice/session/start"""
    session_id: str
    conversation_id: str
    ws_url: str = Field(..., description="WebSocket URL: wss://host/ws/voice/{session_id}")
    initial_greeting: str
    detected_language: str
    state: VoiceState = VoiceState.CONNECTING


class VoiceSessionEndRequest(BaseModel):
    """POST /api/v1/voice/session/end"""
    session_id: str


class TranscriptEntry(BaseModel):
    role: str
    text: str
    time: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class VoiceSessionEndResponse(BaseModel):
    """Response to POST /api/v1/voice/session/end"""
    session_id: str
    conversation_id: str
    duration_seconds: int
    final_transcript: List[TranscriptEntry] = Field(default_factory=list)
    recommended_schemes: List[RankedScheme] = Field(default_factory=list)
    profile_collected: BeneficiaryProfile = Field(default_factory=BeneficiaryProfile)
    state: VoiceState = VoiceState.COMPLETED
