"""
Module: app/integrations/speech/provider.py

Provider abstraction for Speech-to-Text (STT) and Text-to-Speech (TTS).
Business logic never calls a specific vendor directly.

Default: MockSTTProvider / MockTTSProvider (no real API needed for tests).
"""

from __future__ import annotations

import wave
import struct
import math
from abc import ABC, abstractmethod
from typing import Tuple

from app.core.config import settings


# ── Abstract Base Classes ──────────────────────────────────────────────────

class STTProvider(ABC):
    """Abstract base for Speech-to-Text."""

    @abstractmethod
    def transcribe(self, audio_bytes: bytes, language: str = "en-IN") -> Tuple[str, float]:
        """
        Transcribe audio to text.

        Args:
            audio_bytes: Raw audio bytes (PCM 16kHz mono int16).
            language:    BCP-47 language code.

        Returns:
            (transcript_text, confidence_score)
        """
        ...


class TTSProvider(ABC):
    """Abstract base for Text-to-Speech."""

    @abstractmethod
    def synthesize(self, text: str, language: str = "en-IN") -> bytes:
        """
        Convert text to speech audio bytes.

        Args:
            text:     Input text to synthesize.
            language: BCP-47 language code.

        Returns:
            Raw audio bytes (PCM 16kHz mono int16).
        """
        ...


# ── Mock Providers (no API key required) ──────────────────────────────────

class MockSTTProvider(STTProvider):
    """
    Mock STT provider for testing and development.
    Returns a placeholder transcript instead of calling a real API.
    """

    def transcribe(self, audio_bytes: bytes, language: str = "en-IN") -> Tuple[str, float]:
        if not audio_bytes:
            return "", 0.0
        # Return a deterministic mock transcript based on audio length
        duration_approx = len(audio_bytes) / (16000 * 2)  # 16kHz, 16-bit
        if duration_approx < 0.5:
            return "", 0.0
        return "[Mock transcription - configure SPEECH_PROVIDER for real STT]", 0.85


class MockTTSProvider(TTSProvider):
    """
    Mock TTS provider for testing and development.
    Returns minimal valid PCM audio (440Hz sine tone) instead of real speech.
    """

    def synthesize(self, text: str, language: str = "en-IN") -> bytes:
        if not text:
            return b""
        # Generate a short 440Hz sine wave (0.5 seconds at 16kHz, 16-bit)
        sample_rate = settings.VOICE_OUTPUT_SAMPLE_RATE
        duration = 0.5  # seconds
        frequency = 440.0
        num_samples = int(sample_rate * duration)
        audio_samples = []
        for i in range(num_samples):
            sample = int(32767 * 0.3 * math.sin(2 * math.pi * frequency * i / sample_rate))
            audio_samples.append(sample)
        return struct.pack(f"<{num_samples}h", *audio_samples)


# ── Factory Functions ──────────────────────────────────────────────────────

def get_stt_provider() -> STTProvider:
    """
    Return the configured STT provider based on SPEECH_PROVIDER setting.

    Options:
      - "parakeet" → NVIDIA NIM Parakeet 1.1B RNNT Multilingual (requires NVIDIA_API_KEY)
      - "sarvam"   → Sarvam AI (requires SARVAM_API_KEY, Indian languages)
      - "mock"     → Mock provider (default, no API key needed)
    """
    provider = settings.SPEECH_PROVIDER.lower()

    # ── NVIDIA Parakeet 1.1B RNNT Multilingual ────────────────────────────
    if provider == "parakeet":
        if not settings.NVIDIA_API_KEY:
            import logging
            logging.getLogger(__name__).warning(
                "SPEECH_PROVIDER=parakeet but NVIDIA_API_KEY is not set. "
                "Falling back to MockSTTProvider. "
                "Set NVIDIA_API_KEY in .env to enable Parakeet STT."
            )
            return MockSTTProvider()
        from app.integrations.speech.parakeet import ParakeetSTTProvider
        return ParakeetSTTProvider(
            api_key=settings.NVIDIA_API_KEY,
            timeout_seconds=settings.NVIDIA_STT_TIMEOUT,
            self_hosted_url=settings.NVIDIA_NIM_URL,
        )

    # ── Sarvam AI (Indian Languages) ─────────────────────────────────────
    if provider == "sarvam" and settings.SARVAM_API_KEY:
        from app.integrations.speech.sarvam import SarvamSTTProvider
        return SarvamSTTProvider(api_key=settings.SARVAM_API_KEY)

    # ── Default: Mock (no API key required) ───────────────────────────────
    return MockSTTProvider()


def get_tts_provider() -> TTSProvider:
    """
    Return the configured TTS provider.

    Note: Parakeet is STT-only. When SPEECH_PROVIDER=parakeet,
    TTS falls back to Sarvam (if configured) or Mock.
    """
    provider = settings.SPEECH_PROVIDER.lower()

    if provider == "sarvam" and settings.SARVAM_API_KEY:
        from app.integrations.speech.sarvam import SarvamTTSProvider
        return SarvamTTSProvider(api_key=settings.SARVAM_API_KEY)

    # Parakeet is STT-only → use mock TTS unless another TTS is configured
    return MockTTSProvider()
