"""
Package: app/ai/eligibility

Deterministic eligibility engine for government scheme matching.
No LLM is involved in any eligibility decision.

Public API:
    from app.ai.eligibility.evaluator import EligibilityEngine, EligibilityVerdict
    from app.ai.eligibility.rules import SchemeEligibilityRules, SchemeRulesRegistry
    from app.ai.eligibility.conditions import evaluate_condition
    from app.ai.eligibility.validator import validate_profile_completeness
"""
