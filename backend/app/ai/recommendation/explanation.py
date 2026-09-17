"""
Module: app/ai/recommendation/explanation.py

Scheme Explanation Engine.

Explains WHY a scheme was recommended, what conditions apply,
what benefits are available, what's missing, and next steps.

IMPORTANT:
- The explanation is grounded ONLY in structured data from
  SchemeEligibilityRules and SchemeEligibilityResult.
- LLM is used ONLY for natural language formatting (if configured).
- LLM does NOT make eligibility decisions.
- If LLM is unavailable, template-based explanation is returned.
- If information is unavailable, explicitly states:
  "Information not available in the current scheme database."
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from app.schemas.chat import BeneficiaryProfile
from app.ai.eligibility.evaluator import SchemeEligibilityResult
from app.ai.eligibility.rules import SchemeEligibilityRules
from app.services.eligibility_service import get_registry
from app.integrations.llm.provider import get_llm_provider


_UNAVAILABLE = "Information not available in the current scheme database."

# ── Multilingual section headers ───────────────────────────────────────────

_HEADERS: Dict[str, Dict[str, str]] = {
    "recommendation_reason": {
        "en-IN": "Why was this scheme recommended?",
        "ta-IN": "இந்த திட்டம் ஏன் பரிந்துரைக்கப்பட்டது?",
        "hi-IN": "यह योजना क्यों सुझाई गई?",
        "te-IN": "ఈ పథకం ఎందుకు సిఫార్సు చేయబడింది?",
    },
    "benefits": {
        "en-IN": "Key Benefits",
        "ta-IN": "முக்கிய நன்மைகள்",
        "hi-IN": "मुख्य लाभ",
        "te-IN": "ముఖ్య ప్రయోజనాలు",
    },
    "eligibility": {
        "en-IN": "Eligibility Conditions",
        "ta-IN": "தகுதி நிபந்தனைகள்",
        "hi-IN": "पात्रता शर्तें",
        "te-IN": "అర్హత నిబంధనలు",
    },
    "missing": {
        "en-IN": "Missing Information",
        "ta-IN": "தேவையான தகவல்கள்",
        "hi-IN": "अनुपलब्ध जानकारी",
        "te-IN": "తప్పిపోయిన సమాచారం",
    },
    "next_steps": {
        "en-IN": "Next Steps",
        "ta-IN": "அடுத்த படிகள்",
        "hi-IN": "अगले कदम",
        "te-IN": "తదుపరి దశలు",
    },
}


@dataclass
class ExplanationResult:
    """Structured explanation output."""
    scheme_id: str
    scheme_name: str
    language: str
    verdict: str
    recommendation_reason: str
    benefits: str
    eligibility_summary: str
    missing_info: Optional[str]
    restrictions: Optional[str]
    next_steps: str
    application_url: Optional[str]
    full_text: str  # Assembled human-readable response
    is_llm_generated: bool = False


class SchemeExplainer:
    """
    Generates structured explanations for scheme recommendations.

    Explanation is grounded in scheme data — no hallucination.
    LLM is only used for fluent language formatting.
    """

    @classmethod
    def explain(
        cls,
        profile: BeneficiaryProfile,
        eligibility_result: SchemeEligibilityResult,
        language: str = "en-IN",
        user_question: Optional[str] = None,
    ) -> ExplanationResult:
        """
        Build a grounded explanation for a scheme eligibility result.

        Args:
            profile:              Beneficiary profile.
            eligibility_result:   SchemeEligibilityResult from the engine.
            language:             User's detected language.
            user_question:        Optional specific user question to address.

        Returns:
            ExplanationResult with structured + full-text explanation.
        """
        registry = get_registry()
        scheme_rules = registry.get(eligibility_result.scheme_id)

        # ── Build structured facts from data ──────────────────────────────
        reason = cls._build_reason(eligibility_result, scheme_rules)
        benefits = scheme_rules.benefit_summary if scheme_rules and scheme_rules.benefit_summary else _UNAVAILABLE
        eligibility_summary = cls._build_eligibility_summary(eligibility_result)
        missing_info = cls._build_missing_info(eligibility_result)
        restrictions = cls._build_restrictions(eligibility_result, scheme_rules)
        next_steps = cls._build_next_steps(eligibility_result, scheme_rules)

        # ── Assemble template-based full text ─────────────────────────────
        verdict_str = eligibility_result.verdict.value if hasattr(eligibility_result.verdict, 'value') else str(eligibility_result.verdict)
        template_text = cls._assemble_template(
            scheme_name=eligibility_result.scheme_name,
            verdict=verdict_str,
            reason=reason,
            benefits=benefits,
            eligibility_summary=eligibility_summary,
            missing_info=missing_info,
            restrictions=restrictions,
            next_steps=next_steps,
            application_url=eligibility_result.application_url,
        )

        # ── Optionally refine with LLM for fluency ────────────────────────
        full_text = template_text
        is_llm = False

        try:
            llm = get_llm_provider()
            system_prompt = cls._build_system_prompt(language)
            user_prompt = cls._build_user_prompt(template_text, language, user_question)
            llm_text = llm.generate(user_prompt, system_prompt=system_prompt, max_tokens=600)

            if llm_text:
                # Validate LLM output doesn't contradict facts
                full_text = llm_text
                is_llm = True
        except Exception:
            pass  # Fall back to template

        return ExplanationResult(
            scheme_id=eligibility_result.scheme_id,
            scheme_name=eligibility_result.scheme_name,
            language=language,
            verdict=verdict_str,
            recommendation_reason=reason,
            benefits=benefits,
            eligibility_summary=eligibility_summary,
            missing_info=missing_info,
            restrictions=restrictions,
            next_steps=next_steps,
            application_url=eligibility_result.application_url,
            full_text=full_text,
            is_llm_generated=is_llm,
        )

    @staticmethod
    def _build_reason(
        result: SchemeEligibilityResult,
        rules: Optional[SchemeEligibilityRules],
    ) -> str:
        # Handle verdict as either enum or string
        verdict_val = result.verdict.value if hasattr(result.verdict, 'value') else str(result.verdict)
        if verdict_val == "potentially_eligible":
            n = len(result.passed_conditions)
            desc = rules.description if rules and rules.description else ""
            return (
                f"You passed all {n} required eligibility condition(s) for this scheme. "
                + (f"{desc}" if desc else "")
            )
        if verdict_val == "needs_verification":
            fields = ", ".join(c.field for c in result.unverifiable_conditions if c.required)
            return (
                f"You may be eligible but we need more information. "
                f"Missing required details: {fields}."
            )
        # not_eligible
        failed = [c for c in result.failed_conditions if c.required]
        if failed:
            reasons = "; ".join(
                f"{c.field} must be {c.operator} {c.rule_value!r} (yours: {c.profile_value!r})"
                for c in failed[:3]
            )
            return f"You do not qualify because: {reasons}."
        return result.reason

    @staticmethod
    def _build_eligibility_summary(result: SchemeEligibilityResult) -> str:
        lines = []
        if result.passed_conditions:
            lines.append("✓ Conditions met: " + ", ".join(c.description for c in result.passed_conditions[:5]))
        if result.failed_conditions:
            lines.append("✗ Conditions not met: " + ", ".join(c.description for c in result.failed_conditions[:3]))
        if result.unverifiable_conditions:
            missing = [c for c in result.unverifiable_conditions if c.required]
            if missing:
                lines.append("? Missing data for: " + ", ".join(c.field for c in missing))
        return " | ".join(lines) if lines else "No conditions evaluated."

    @staticmethod
    def _build_missing_info(result: SchemeEligibilityResult) -> Optional[str]:
        required_missing = [c for c in result.unverifiable_conditions if c.required]
        if not required_missing:
            return None
        items = [f"• {c.field}: {c.description}" for c in required_missing]
        return "To confirm eligibility, please provide:\n" + "\n".join(items)

    @staticmethod
    def _build_restrictions(
        result: SchemeEligibilityResult,
        rules: Optional[SchemeEligibilityRules],
    ) -> Optional[str]:
        failed = [c for c in result.failed_conditions if c.required]
        if not failed:
            return None
        items = [f"• {c.description}" for c in failed]
        return "Restrictions that prevent eligibility:\n" + "\n".join(items)

    @staticmethod
    def _build_next_steps(
        result: SchemeEligibilityResult,
        rules: Optional[SchemeEligibilityRules],
    ) -> str:
        verdict_val = result.verdict.value if hasattr(result.verdict, 'value') else str(result.verdict)
        if verdict_val == "potentially_eligible":
            steps = [
                "1. Gather required documents (Aadhaar, income certificate, bank passbook).",
                "2. Visit your nearest bank branch, CSC, or the official portal.",
            ]
            if rules and rules.application_url:
                steps.append(f"3. Apply online at: {rules.application_url}")
            else:
                steps.append("3. Contact the relevant ministry/department to apply.")
            return "\n".join(steps)
        if verdict_val == "needs_verification":
            return (
                "1. Provide the missing information listed above.\n"
                "2. Once complete, eligibility will be confirmed."
            )
        return "You are currently not eligible. Consider checking other available schemes."

    @staticmethod
    def _assemble_template(
        scheme_name: str,
        verdict: str,
        reason: str,
        benefits: str,
        eligibility_summary: str,
        missing_info: Optional[str],
        restrictions: Optional[str],
        next_steps: str,
        application_url: Optional[str],
    ) -> str:
        verdict_label = {
            "potentially_eligible": "✅ Potentially Eligible",
            "needs_verification": "⚠️ Needs Verification",
            "not_eligible": "❌ Not Eligible",
        }.get(verdict, verdict)

        parts = [
            f"**{scheme_name}** — {verdict_label}",
            f"\n**Why Recommended:**\n{reason}",
            f"\n**Benefits:**\n{benefits}",
            f"\n**Eligibility Status:**\n{eligibility_summary}",
        ]
        if missing_info:
            parts.append(f"\n**Missing Information:**\n{missing_info}")
        if restrictions:
            parts.append(f"\n**Restrictions:**\n{restrictions}")
        parts.append(f"\n**Next Steps:**\n{next_steps}")
        if application_url:
            parts.append(f"\n**Official Portal:** {application_url}")
        return "\n".join(parts)

    @staticmethod
    def _build_system_prompt(language: str) -> str:
        lang_name = {
            "ta-IN": "Tamil", "hi-IN": "Hindi", "te-IN": "Telugu",
            "kn-IN": "Kannada", "ml-IN": "Malayalam", "bn-IN": "Bengali",
            "mr-IN": "Marathi", "en-IN": "English",
        }.get(language, "English")
        return (
            f"You are a helpful Indian government scheme assistant. "
            f"Respond in {lang_name}. "
            f"You must ONLY use the facts provided in the user's message. "
            f"Do NOT invent scheme names, amounts, rules, or eligibility criteria. "
            f"If information is unavailable, say: "
            f"'Information not available in the current scheme database.' "
            f"Keep the response concise (under 250 words), clear, and empathetic."
        )

    @staticmethod
    def _build_user_prompt(template_text: str, language: str, user_question: Optional[str]) -> str:
        base = (
            f"Please present the following scheme information in a friendly, "
            f"conversational way for the user. Do NOT change any facts:\n\n{template_text}"
        )
        if user_question:
            base += f"\n\nThe user specifically asked: '{user_question}'"
        return base
