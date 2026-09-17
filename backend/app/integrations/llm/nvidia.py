"""
Module: app/integrations/llm/nvidia.py

NVIDIA NIM / API LLM provider implementation.
Supported Models:
- meta/llama-3.1-70b-instruct (Default)
- meta/llama-3.3-70b-instruct
- mistralai/mistral-large-2-instruct
- nvidia/neva-22b
"""

from __future__ import annotations
from typing import Optional
import os
import requests

from app.integrations.llm.provider import LLMProvider


class NvidiaLLMProvider(LLMProvider):
    """NVIDIA NIM / API LLM provider implementation."""

    def __init__(self, api_key: str, max_tokens: int = 1024, model: Optional[str] = None) -> None:
        self._api_key = api_key
        self._max_tokens = max_tokens
        self._model = model or os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.3,
    ) -> str:
        try:
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self._api_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            }

            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            payload = {
                "model": self._model,
                "messages": messages,
                "temperature": temperature,
                "top_p": 0.95,
                "max_tokens": min(max_tokens, self._max_tokens),
            }

            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0]["message"]["content"]
                    if content:
                        return content.strip()

            # OpenAI SDK fallback using NVIDIA base_url
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self._api_key, base_url="https://integrate.api.nvidia.com/v1")
                res = client.chat.completions.create(
                    model=self._model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=min(max_tokens, self._max_tokens),
                )
                if res.choices and res.choices[0].message.content:
                    return res.choices[0].message.content.strip()
            except Exception:
                pass

            return ""
        except Exception:
            return ""
