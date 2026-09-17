"""
Module: app/integrations/speech/sarvam.py

Sarvam AI speech integration (Indian language STT/TTS).
Only activated when SARVAM_API_KEY is configured.

Sarvam API docs: https://docs.sarvam.ai
"""

from __future__ import annotations

import io
from typing import Tuple

import httpx

from app.integrations.speech.provider import STTProvider, TTSProvider


class SarvamSTTProvider(STTProvider):
    """Sarvam AI Speech-to-Text for Indian languages."""

    BASE_URL = "https://api.sarvam.ai"
    STT_ENDPOINT = "/speech-to-text"

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._headers = {"api-subscription-key": api_key}

    def transcribe(self, audio_bytes: bytes, language: str = "hi-IN") -> Tuple[str, float]:
        """
        Transcribe audio using Sarvam AI.

        Audio should be PCM 16kHz mono (will be wrapped in WAV for the API).
        """
        if not audio_bytes:
            return "", 0.0

        try:
            # Wrap raw PCM in a minimal WAV container
            wav_bytes = self._pcm_to_wav(audio_bytes)

            # Map BCP-47 to Sarvam language code
            sarvam_lang = self._map_language(language)

            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    f"{self.BASE_URL}{self.STT_ENDPOINT}",
                    headers=self._headers,
                    files={"file": ("audio.wav", wav_bytes, "audio/wav")},
                    data={"language_code": sarvam_lang, "model": "saarika:v1"},
                )
                response.raise_for_status()
                data = response.json()
                transcript = data.get("transcript", "")
                confidence = float(data.get("confidence", 0.85))
                return transcript, confidence

        except httpx.TimeoutException:
            raise RuntimeError("Sarvam STT timeout") from None
        except Exception as e:
            raise RuntimeError(f"Sarvam STT error: {type(e).__name__}") from None

    @staticmethod
    def _map_language(bcp47: str) -> str:
        mapping = {
            "ta-IN": "ta-IN", "hi-IN": "hi-IN", "te-IN": "te-IN",
            "kn-IN": "kn-IN", "ml-IN": "ml-IN", "bn-IN": "bn-IN",
            "mr-IN": "mr-IN", "en-IN": "en-IN",
        }
        return mapping.get(bcp47, "en-IN")

    @staticmethod
    def _pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 16000, channels: int = 1, sampwidth: int = 2) -> bytes:
        import wave, io
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(sampwidth)
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_bytes)
        return buf.getvalue()


class SarvamTTSProvider(TTSProvider):
    """Sarvam AI Text-to-Speech for Indian languages."""

    BASE_URL = "https://api.sarvam.ai"
    TTS_ENDPOINT = "/text-to-speech"

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._headers = {
            "api-subscription-key": api_key,
            "Content-Type": "application/json",
        }

    def synthesize(self, text: str, language: str = "hi-IN") -> bytes:
        if not text:
            return b""

        try:
            sarvam_lang = SarvamSTTProvider._map_language(language)

            with httpx.Client(timeout=15.0) as client:
                response = client.post(
                    f"{self.BASE_URL}{self.TTS_ENDPOINT}",
                    headers=self._headers,
                    json={
                        "inputs": [text],
                        "target_language_code": sarvam_lang,
                        "speaker": "meera",
                        "model": "bulbul:v1",
                        "enable_preprocessing": True,
                    }
                )
                response.raise_for_status()
                data = response.json()
                # Sarvam returns base64-encoded WAV
                import base64
                b64_audio = data.get("audios", [""])[0]
                if not b64_audio:
                    return b""
                wav_bytes = base64.b64decode(b64_audio)
                # Extract raw PCM from WAV
                return self._wav_to_pcm(wav_bytes)

        except httpx.TimeoutException:
            raise RuntimeError("Sarvam TTS timeout") from None
        except Exception as e:
            raise RuntimeError(f"Sarvam TTS error: {type(e).__name__}") from None

    @staticmethod
    def _wav_to_pcm(wav_bytes: bytes) -> bytes:
        import wave, io
        with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
            return wf.readframes(wf.getnframes())
