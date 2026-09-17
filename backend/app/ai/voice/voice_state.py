"""
Module: app/ai/voice/voice_state.py

VoiceSessionState — complete state for a live voice call session.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.schemas.chat import BeneficiaryProfile
from app.schemas.voice import VoiceState, TranscriptEntry
from app.schemas.conversation import ConversationState, WorkflowState


@dataclass
class VoiceSessionState:
    """
    State maintained for a live voice call WebSocket session.

    Reuses ConversationState for profile + recommendations.
    Adds voice-specific state: audio buffers, VAD, barge-in flag.
    """
    session_id: str
    conversation_id: str
    ws_state: VoiceState = VoiceState.CONNECTING
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_active: datetime = field(default_factory=datetime.utcnow)

    # Language + profile
    detected_language: str = "en-IN"
    language_preference: Optional[str] = None
    profile: BeneficiaryProfile = field(default_factory=BeneficiaryProfile)

    # Workflow
    workflow_state: WorkflowState = WorkflowState.START
    conversation_state: Optional[ConversationState] = None

    # Transcript
    transcript: List[TranscriptEntry] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.utcnow)

    # Audio pipeline state
    audio_buffer: bytes = b""
    is_speaking: bool = False       # TTS currently playing
    barge_in_requested: bool = False
    vad_silence_frames: int = 0     # Frames of silence since last speech
    vad_speech_frames: int = 0      # Consecutive speech frames

    # Recommendations
    recommendations: List[Dict[str, Any]] = field(default_factory=list)

    # SMS state
    phone_number: Optional[str] = None  # Handled transiently in memory
    sms_requested: bool = False
    sms_sent: bool = False
    sms_consent_at: Optional[datetime] = None

    def elapsed_seconds(self) -> int:
        return int((datetime.utcnow() - self.start_time).total_seconds())

    def elapsed_str(self) -> str:
        s = self.elapsed_seconds()
        return f"{s // 60}:{s % 60:02d}"

    def append_transcript(self, role: str, text: str) -> None:
        self.transcript.append(TranscriptEntry(role=role, text=text, time=self.elapsed_str()))

    def is_expired(self, timeout_seconds: int) -> bool:
        return (datetime.utcnow() - self.last_active).total_seconds() > timeout_seconds

    def touch(self) -> None:
        self.last_active = datetime.utcnow()
