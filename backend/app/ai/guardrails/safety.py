"""
Module: app/ai/guardrails/safety.py

Safety filter — removes offensive, harmful, or inappropriate content
from user-facing AI responses.

This is a lightweight keyword-based filter for the MVP.
In production, this should be replaced with a proper content moderation API.
"""

from __future__ import annotations

import re


# Patterns to detect and replace in AI responses
_UNSAFE_PATTERNS = [
    # Remove any accidental key/token leakage patterns
    (r'\b(sk-[A-Za-z0-9]{20,})\b', '[REDACTED_KEY]'),
    (r'\b(AIza[A-Za-z0-9_-]{35})\b', '[REDACTED_KEY]'),
    # Stack trace patterns
    (r'Traceback \(most recent call last\).*?(?=\n\n|\Z)', '[INTERNAL_ERROR]'),
    # File path leakage
    (r'(C:\\|/home/|/Users/)([^\s]+)', '[PATH_REDACTED]'),
]


class SafetyFilter:
    """Lightweight safety filter for AI-generated responses."""

    @classmethod
    def filter(cls, text: str) -> str:
        """
        Apply safety filtering to AI-generated text.

        Args:
            text: Raw AI response text.

        Returns:
            Filtered text safe to send to the frontend.
        """
        filtered = text
        for pattern, replacement in _UNSAFE_PATTERNS:
            filtered = re.sub(pattern, replacement, filtered, flags=re.DOTALL | re.IGNORECASE)

        # Remove any emoji symbols
        filtered = re.sub(r'[\U00010000-\U0010ffff\u2600-\u26FF\u2700-\u27BF]', '', filtered)

        return filtered
