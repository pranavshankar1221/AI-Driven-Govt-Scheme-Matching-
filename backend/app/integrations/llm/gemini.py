"""
Module: app/integrations/llm/gemini.py

Google Gemini LLM provider implementation.
Only activated when GEMINI_API_KEY is set.
"""

from __future__ import annotations

from typing import Optional

from app.integrations.llm.provider import LLMProvider


class GeminiProvider(LLMProvider):
    """Google Gemini provider via google-generativeai SDK."""

    def __init__(self, api_key: str, max_tokens: int = 1024) -> None:
        self._api_key = api_key
        self._max_tokens = max_tokens
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self._api_key)
                self._model = genai.GenerativeModel("gemini-1.5-flash")
            except ImportError:
                raise RuntimeError(
                    "google-generativeai package not installed. "
                    "Run: pip install google-generativeai"
                )
        return self._model

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 512,
        temperature: float = 0.3,
    ) -> str:
        try:
            model = self._get_model()
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = model.generate_content(
                full_prompt,
                generation_config={
                    "max_output_tokens": min(max_tokens, self._max_tokens),
                    "temperature": temperature,
                }
            )
            return response.text.strip() if response.text else ""
        except Exception as e:
            # Never surface API keys or internal details
            raise RuntimeError(f"LLM generation failed: {type(e).__name__}") from None
