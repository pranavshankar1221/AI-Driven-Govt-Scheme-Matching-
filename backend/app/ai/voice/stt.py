"""
Module: app/ai/voice/stt.py

STT Processor — transcribes audio bytes to text.
Delegates to the configured speech provider (mock by default).
Reuses the language detection module after transcription.
"""

from __future__ import annotations

from typing import Tuple

from app.integrations.speech.provider import get_stt_provider
from app.core.config import settings


class STTProcessor:
    """Speech-to-Text processor. Provider-agnostic."""

    @classmethod
    def transcribe(
        cls,
        audio_bytes: bytes,
        language: str = "en-IN",
    ) -> Tuple[str, float]:
        """
        Transcribe raw PCM audio to text.

        Args:
            audio_bytes: Raw PCM audio bytes (16kHz, mono, int16).
            language:    BCP-47 language hint for the STT provider.

        Returns:
            (transcript_text, confidence_score)

        Raises:
            ValueError: If audio_bytes exceeds MAX_AUDIO_SIZE_BYTES.
            RuntimeError: If the STT provider fails.
        """
        if not audio_bytes:
            return "", 0.0

        # Security: reject oversized audio frames
        if len(audio_bytes) > settings.MAX_AUDIO_SIZE_BYTES:
            raise ValueError(
                f"Audio frame too large: {len(audio_bytes)} bytes. "
                f"Maximum allowed: {settings.MAX_AUDIO_SIZE_BYTES} bytes."
            )

        provider = get_stt_provider()
        return provider.transcribe(audio_bytes, language=language)


class VADProcessor:
    """
    Simple energy-based Voice Activity Detection (VAD).

    Detects if an audio frame contains speech or silence based on
    RMS energy threshold. No external library required.

    For production: replace with WebRTC VAD or Silero VAD.
    """

    # RMS energy thresholds (for 16-bit PCM at 16kHz)
    SPEECH_THRESHOLD: float = 500.0   # Min RMS to consider as speech
    SILENCE_THRESHOLD: float = 300.0  # Below this = silence
    SPEECH_FRAMES_REQUIRED: int = 3   # Consecutive speech frames to trigger STT
    SILENCE_FRAMES_REQUIRED: int = 20 # Consecutive silence frames to end utterance (~0.6s)

    @classmethod
    def is_speech(cls, audio_bytes: bytes) -> bool:
        """Detect if audio frame contains speech (energy-based)."""
        if not audio_bytes:
            return False
        import struct
        num_samples = len(audio_bytes) // 2
        if num_samples == 0:
            return False
        try:
            samples = struct.unpack(f"<{num_samples}h", audio_bytes[:num_samples * 2])
            rms = (sum(s * s for s in samples) / num_samples) ** 0.5
            return rms > cls.SPEECH_THRESHOLD
        except struct.error:
            return False
