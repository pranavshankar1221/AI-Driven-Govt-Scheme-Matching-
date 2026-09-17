"""
Module: app/integrations/llm/provider.py

Provider abstraction for LLM integrations.
Business logic NEVER calls a specific provider directly — only this interface.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.core.config import settings


class LLMProvider(ABC):
    """Abstract base class for all LLM providers."""

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 512,
        temperature: float = 0.3,
    ) -> str:
        """
        Generate a text completion.

        Args:
            prompt:        User-facing prompt.
            system_prompt: Optional system instruction.
            max_tokens:    Max output tokens.
            temperature:   Sampling temperature (0 = deterministic).

        Returns:
            Generated text string.
        """
        ...


class NoOpLLMProvider(LLMProvider):
    """
    Fallback provider that returns an empty string.
    Used when no LLM API key is configured.
    Callers must always check for an empty string and fall back to
    template-based responses.
    """

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 512,
        temperature: float = 0.3,
    ) -> str:
        return ""


def get_llm_provider() -> LLMProvider:
    """
    Factory: returns the configured LLM provider instance.

    Selection order:
      1. settings.LLM_PROVIDER == "nvidia" or settings.NVIDIA_API_KEY set → NvidiaLLMProvider
      2. settings.LLM_PROVIDER == "gemini" and GEMINI_API_KEY set → GeminiProvider
      3. settings.LLM_PROVIDER == "openai" and OPENAI_API_KEY set → OpenAIProvider
      4. Fallback → NoOpLLMProvider (template-based responses only)
    """
    provider = settings.LLM_PROVIDER.lower()

    if (provider == "nvidia" or settings.NVIDIA_API_KEY) and settings.NVIDIA_API_KEY:
        from app.integrations.llm.nvidia import NvidiaLLMProvider
        return NvidiaLLMProvider(api_key=settings.NVIDIA_API_KEY, max_tokens=settings.LLM_MAX_TOKENS)

    if provider == "gemini" and settings.GEMINI_API_KEY:
        from app.integrations.llm.gemini import GeminiProvider
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, max_tokens=settings.LLM_MAX_TOKENS)

    if provider == "openai" and settings.OPENAI_API_KEY:
        from app.integrations.llm.openai import OpenAIProvider
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY, max_tokens=settings.LLM_MAX_TOKENS)

    return NoOpLLMProvider()
