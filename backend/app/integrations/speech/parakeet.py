"""
Module: app/integrations/speech/parakeet.py

NVIDIA NIM — Parakeet 1.1B RNNT Multilingual STT Provider.

Uses the NVIDIA NIM hosted inference API (integrate.api.nvidia.com).
Only activated when NVIDIA_API_KEY is configured and SPEECH_PROVIDER=parakeet.

API Reference:
  https://build.nvidia.com/nvidia/parakeet-1-1b-rnnt-multilingual

Supported Languages (ISO 639-1 → BCP-47 mapping):
  English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali,
  Marathi, Punjabi, Gujarati, Odia, Urdu, and more (multilingual model).

Audio Requirements:
  - Format: WAV (RIFF PCM, 16-bit)
  - Sample Rate: 16000 Hz
  - Channels: 1 (mono)
  - Maximum duration: ~60 seconds per call

Error Handling:
  - Timeouts raise RuntimeError (recoverable by caller).
  - HTTP 401/403 raise RuntimeError with key guidance.
  - HTTP 429 (rate limit) raises RuntimeError — caller should retry.
"""

from __future__ import annotations

import io
import wave
import json
import base64
import logging
from typing import Tuple

import httpx

from app.integrations.speech.provider import STTProvider

logger = logging.getLogger(__name__)

# ── NVIDIA NIM Endpoint ───────────────────────────────────────────────────────
# Cloud-hosted NIM inference endpoint (no self-hosting required).
_NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
_NIM_ASR_PATH = "/asr"  # Parakeet NIM ASR endpoint
_NIM_MODEL_ID = "nvidia/parakeet-1.1b-rnnt-multilingual"

# ── Language Code Mapping (BCP-47 → ISO 639-1) ───────────────────────────────
# Parakeet 1.1B RNNT Multilingual accepts ISO 639-1 short codes.
_LANGUAGE_MAP: dict[str, str] = {
    "en-IN": "en",
    "en-US": "en",
    "en-GB": "en",
    "hi-IN": "hi",
    "ta-IN": "ta",
    "te-IN": "te",
    "kn-IN": "kn",
    "ml-IN": "ml",
    "bn-IN": "bn",
    "mr-IN": "mr",
    "pa-IN": "pa",
    "gu-IN": "gu",
    "or-IN": "or",
    "ur-IN": "ur",
    "as-IN": "as",
}

_DEFAULT_ISO = "en"


class ParakeetSTTProvider(STTProvider):
    """
    NVIDIA NIM Parakeet 1.1B RNNT Multilingual Speech-to-Text provider.

    Accepts raw PCM audio (16kHz, mono, int16), wraps it in a WAV container,
    and sends it to the NVIDIA NIM REST API for transcription.

    Instantiation:
        provider = ParakeetSTTProvider(api_key="nvapi-xxxxxxx")

    Transcription:
        text, confidence = provider.transcribe(pcm_bytes, language="hi-IN")
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = _NIM_BASE_URL,
        timeout_seconds: float = 30.0,
        self_hosted_url: str = "",
    ) -> None:
        """
        Args:
            api_key:          NVIDIA NGC API key (starts with "nvapi-").
            base_url:         NIM base URL (default: cloud-hosted).
            timeout_seconds:  HTTP request timeout.
            self_hosted_url:  Override for self-hosted NIM (e.g. "http://localhost:9000").
        """
        if not api_key:
            raise ValueError(
                "NVIDIA_API_KEY must be set to use the Parakeet STT provider. "
                "Get your key at https://build.nvidia.com/nvidia/parakeet-1-1b-rnnt-multilingual"
            )

        self._api_key = api_key
        self._timeout = timeout_seconds

        # Use self-hosted URL if provided
        if self_hosted_url:
            self._endpoint = f"{self_hosted_url.rstrip('/')}{_NIM_ASR_PATH}"
        else:
            self._endpoint = f"{base_url.rstrip('/')}{_NIM_ASR_PATH}"

        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        }

    # ── Public API ─────────────────────────────────────────────────────────

    def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "en-IN",
    ) -> Tuple[str, float]:
        """
        Transcribe PCM audio using the NVIDIA Parakeet NIM.

        Args:
            audio_bytes: Raw PCM bytes (16kHz, mono, int16).
            language:    BCP-47 language hint (e.g. "hi-IN", "ta-IN", "en-IN").

        Returns:
            (transcript_text, confidence_score)
            confidence_score is 1.0 if the provider does not return a score.

        Raises:
            RuntimeError: On STT failure (timeout, auth error, server error).
        """
        if not audio_bytes:
            return "", 0.0

        iso_lang = self._map_language(language)

        try:
            wav_bytes = self._pcm_to_wav(audio_bytes)
        except Exception as e:
            raise RuntimeError(f"Parakeet STT: Failed to convert PCM to WAV: {e}") from None

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(
                    self._endpoint,
                    headers=self._headers,
                    files={
                        "audio": ("audio.wav", io.BytesIO(wav_bytes), "audio/wav"),
                    },
                    data={
                        "model": _NIM_MODEL_ID,
                        "language": iso_lang,
                        "response_format": "json",
                    },
                )

                if response.status_code == 401:
                    raise RuntimeError(
                        "Parakeet STT: Authentication failed. "
                        "Check your NVIDIA_API_KEY at https://build.nvidia.com."
                    )

                if response.status_code == 403:
                    raise RuntimeError(
                        "Parakeet STT: Access denied. Ensure your NVIDIA API key "
                        "has access to the Parakeet 1.1B RNNT Multilingual model."
                    )

                if response.status_code == 429:
                    raise RuntimeError(
                        "Parakeet STT: Rate limit exceeded. Please retry after a short delay."
                    )

                if response.status_code == 413:
                    raise RuntimeError(
                        "Parakeet STT: Audio payload too large. "
                        "Reduce audio duration or chunk size."
                    )

                response.raise_for_status()
                return self._parse_response(response)

        except httpx.TimeoutException:
            raise RuntimeError(
                f"Parakeet STT: Request timed out after {self._timeout}s. "
                "Check network connectivity or increase NVIDIA_STT_TIMEOUT."
            ) from None

        except httpx.RequestError as e:
            raise RuntimeError(
                f"Parakeet STT: Network error — {type(e).__name__}: {e}"
            ) from None

        except RuntimeError:
            raise  # Re-raise our own descriptive errors

        except Exception as e:
            logger.error("Parakeet STT: Unexpected error: %s", e, exc_info=True)
            raise RuntimeError(f"Parakeet STT: Unexpected error — {type(e).__name__}") from None

    # ── Private Helpers ────────────────────────────────────────────────────

    @staticmethod
    def _map_language(bcp47: str) -> str:
        """Map BCP-47 language code to ISO 639-1 for Parakeet."""
        code = _LANGUAGE_MAP.get(bcp47)
        if code:
            return code
        # Try prefix match (e.g. "hi" from "hi-IN-something")
        prefix = bcp47.split("-")[0].lower()
        if len(prefix) == 2:
            return prefix
        logger.warning(
            "Parakeet STT: Unknown language '%s', defaulting to '%s'.",
            bcp47,
            _DEFAULT_ISO,
        )
        return _DEFAULT_ISO

    @staticmethod
    def _pcm_to_wav(
        pcm_bytes: bytes,
        sample_rate: int = 16000,
        channels: int = 1,
        sampwidth: int = 2,  # 16-bit
    ) -> bytes:
        """Wrap raw PCM bytes in a WAV container."""
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(sampwidth)
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_bytes)
        return buf.getvalue()

    @staticmethod
    def _parse_response(response: httpx.Response) -> Tuple[str, float]:
        """
        Parse the NIM JSON response.

        Expected formats:
          {"text": "...", "confidence": 0.97}
          {"transcription": "...", "segments": [...]}
          {"choices": [{"text": "..."}]}
        """
        try:
            data = response.json()
        except Exception:
            # Fall back to raw text if JSON parse fails
            raw = response.text.strip()
            return raw if raw else "", 1.0

        # Format 1: {"text": "...", "confidence": optional}
        if "text" in data:
            text = str(data["text"]).strip()
            confidence = float(data.get("confidence", 1.0))
            return text, confidence

        # Format 2: {"transcription": "..."}
        if "transcription" in data:
            text = str(data["transcription"]).strip()
            confidence = float(data.get("confidence", 1.0))
            return text, confidence

        # Format 3: OpenAI-compatible {"choices": [{"text": "..."}]}
        if "choices" in data and data["choices"]:
            choice = data["choices"][0]
            text = str(choice.get("text", "")).strip()
            confidence = 1.0
            return text, confidence

        # Format 4: segments-only (sum up all segment texts)
        if "segments" in data and data["segments"]:
            texts = [seg.get("text", "") for seg in data["segments"]]
            combined = " ".join(t.strip() for t in texts if t.strip())
            # Average confidence over segments if available
            confidences = [
                float(seg["confidence"])
                for seg in data["segments"]
                if "confidence" in seg
            ]
            avg_conf = sum(confidences) / len(confidences) if confidences else 1.0
            return combined, avg_conf

        logger.warning(
            "Parakeet STT: Unexpected response format. Keys: %s",
            list(data.keys()),
        )
        return "", 0.0
