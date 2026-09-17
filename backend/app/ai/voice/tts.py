"""
Module: app/ai/voice/tts.py

TTS Processor — converts text to speech audio bytes.
Delegates to the configured speech provider (mock by default).
"""

from __future__ import annotations

from app.integrations.speech.provider import get_tts_provider


class TTSProcessor:
    """Text-to-Speech processor. Provider-agnostic."""

    @classmethod
    def synthesize(
        cls,
        text: str,
        language: str = "en-IN",
    ) -> bytes:
        """
        Convert text to PCM audio bytes.

        Args:
            text:     Input text to synthesize.
            language: BCP-47 language code.

        Returns:
            Raw PCM audio bytes (16kHz, mono, int16).
            Returns empty bytes if text is empty.

        Raises:
            RuntimeError: If the TTS provider fails.
        """
        if not text or not text.strip():
            return b""

        # Truncate very long texts to prevent TTS overload
        max_chars = 1000
        if len(text) > max_chars:
            text = text[:max_chars] + "..."

        provider = get_tts_provider()
        return provider.synthesize(text, language=language)
