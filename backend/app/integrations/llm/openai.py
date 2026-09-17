"""
Module: app/integrations/llm/openai.py

OpenAI LLM provider implementation.
Only activated when OPENAI_API_KEY is set.
"""

from __future__ import annotations

from typing import Optional

from app.integrations.llm.provider import LLMProvider


class OpenAIProvider(LLMProvider):
    """OpenAI provider via openai SDK."""

    def __init__(self, api_key: str, max_tokens: int = 1024) -> None:
        self._api_key = api_key
        self._max_tokens = max_tokens
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self._api_key)
            except ImportError:
                raise RuntimeError(
                    "openai package not installed. Run: pip install openai"
                )
        return self._client

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 512,
        temperature: float = 0.3,
    ) -> str:
        try:
            client = self._get_client()
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=min(max_tokens, self._max_tokens),
                temperature=temperature,
            )
            content = response.choices[0].message.content
            return content.strip() if content else ""
        except Exception as e:
            raise RuntimeError(f"LLM generation failed: {type(e).__name__}") from None
