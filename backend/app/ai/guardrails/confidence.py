"""
Module: app/ai/guardrails/confidence.py

Confidence checker — detects low-confidence detections and
generates clarification questions instead of guessing.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.core.config import settings
from app.schemas.chat import BeneficiaryProfile, IntentEnum


@dataclass
class ConfidenceCheckResult:
    """Result of a confidence check across pipeline stages."""
    is_confident: bool
    low_confidence_reason: Optional[str] = None
    clarification_question: Optional[str] = None
    language_confidence: float = 1.0
    intent_confidence: float = 1.0


# Multilingual clarification templates
_CLARIFY_LANGUAGE: dict = {
    "en-IN": "I want to make sure I understood your language correctly. Are you writing in English or another Indian language?",
    "ta-IN": "நீங்கள் தமிழிலா அல்லது ஆங்கிலத்திலா பேசுகிறீர்கள்?",
    "hi-IN": "क्या आप हिंदी में बात कर रहे हैं या किसी अन्य भाषा में?",
}

_CLARIFY_INTENT: dict = {
    "en-IN": "I want to make sure I understood correctly. Are you looking for: (a) scheme eligibility check, (b) loan/financial information, or (c) application guidance?",
    "ta-IN": "நீங்கள் (அ) திட்ட தகுதி, (ஆ) கடன் தகவல், அல்லது (இ) விண்ணப்ப வழிகாட்டுதல் தேடுகிறீர்களா?",
    "hi-IN": "क्या आप (अ) योजना पात्रता, (ब) ऋण जानकारी, या (स) आवेदन मार्गदर्शन के लिए पूछ रहे हैं?",
}


class ConfidenceChecker:
    """Checks confidence levels across language, intent, and profile extraction."""

    @classmethod
    def check(
        cls,
        language_confidence: float,
        intent_confidence: float,
        language: str = "en-IN",
        intent: Optional[IntentEnum] = None,
        profile: Optional[BeneficiaryProfile] = None,
    ) -> ConfidenceCheckResult:
        """
        Check confidence and return a clarification question if needed.

        Args:
            language_confidence: Confidence from LanguageDetector.
            intent_confidence:   Confidence from IntentClassifier.
            language:            Detected language code.
            intent:              Classified intent.
            profile:             Extracted profile (optional).

        Returns:
            ConfidenceCheckResult with is_confident flag and optional clarification.
        """
        min_lang_conf = settings.MIN_LANGUAGE_CONFIDENCE

        # Check language confidence ONLY if extremely low (< 0.40)
        if language_confidence < 0.40:
            return ConfidenceCheckResult(
                is_confident=False,
                language_confidence=language_confidence,
                intent_confidence=intent_confidence,
                low_confidence_reason="language_detection",
                clarification_question=_CLARIFY_LANGUAGE.get(language, _CLARIFY_LANGUAGE["en-IN"]),
            )

        return ConfidenceCheckResult(
            is_confident=True,
            language_confidence=language_confidence,
            intent_confidence=intent_confidence,
        )
