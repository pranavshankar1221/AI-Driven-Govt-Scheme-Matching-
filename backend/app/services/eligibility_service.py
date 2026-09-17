"""
Module: app/services/eligibility_service.py

Service layer that:
  1. Loads scheme eligibility rules from the JSON data store at startup.
  2. Exposes a registry of SchemeEligibilityRules for the engine.
  3. Runs the deterministic EligibilityEngine against beneficiary profiles.

NO LLM is used here. All eligibility decisions are purely rule-based.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from app.ai.eligibility.evaluator import (
    EligibilityEngine,
    EligibilityVerdict,
    SchemeEligibilityResult,
)
from app.ai.eligibility.rules import SchemeEligibilityRules, SchemeRulesRegistry
from app.schemas.chat import BeneficiaryProfile
from app.schemas.eligibility import (
    ConditionResultSchema,
    EligibilityCheckResponse,
    SchemeEligibilityResultSchema,
)


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
_RULES_FILE = _BASE_DIR / "data" / "schemes" / "eligibility_rules.json"


# ---------------------------------------------------------------------------
# Registry — loaded once at process startup
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _load_registry() -> SchemeRulesRegistry:
    """
    Parse eligibility_rules.json and populate the in-memory registry.
    Called once; result is cached for the lifetime of the process.
    """
    registry = SchemeRulesRegistry()

    if not _RULES_FILE.exists():
        # Graceful degradation: empty registry (no schemes to check against)
        return registry

    with open(_RULES_FILE, encoding="utf-8") as fh:
        raw_list: list = json.load(fh)

    for item in raw_list:
        try:
            registry.load_from_dict(item)
        except Exception as exc:
            # Log and skip malformed scheme entries — never crash the API
            print(f"[EligibilityService] WARNING: Skipping scheme '{item.get('scheme_id', '?')}': {exc}")

    return registry


def get_registry() -> SchemeRulesRegistry:
    """Public accessor for the singleton registry."""
    return _load_registry()


# ---------------------------------------------------------------------------
# Service function
# ---------------------------------------------------------------------------

def check_eligibility(
    profile: BeneficiaryProfile,
    scheme_ids: Optional[List[str]] = None,
) -> EligibilityCheckResponse:
    """
    Run the deterministic eligibility engine for a given beneficiary profile.

    Args:
        profile:    Extracted BeneficiaryProfile (12 fields).
        scheme_ids: If provided, only these schemes are evaluated.
                    If None or empty, all loaded schemes are evaluated.

    Returns:
        EligibilityCheckResponse with per-scheme verdicts and condition detail.
    """
    registry = get_registry()

    # Resolve which schemes to evaluate
    if scheme_ids:
        rules_list = [
            r for sid in scheme_ids
            if (r := registry.get(sid)) is not None
        ]
    else:
        rules_list = registry.all()

    # Run deterministic engine
    engine_results: List[SchemeEligibilityResult] = EligibilityEngine.evaluate_all(
        profile=profile,
        scheme_rules_list=rules_list,
    )

    # Map engine results → API response schemas
    result_schemas: List[SchemeEligibilityResultSchema] = []
    for er in engine_results:
        result_schemas.append(
            SchemeEligibilityResultSchema(
                scheme_id=er.scheme_id,
                scheme_name=er.scheme_name,
                verdict=er.verdict.value,
                reason=er.reason,
                benefit_summary=er.benefit_summary,
                application_url=er.application_url,
                passed_conditions=[
                    ConditionResultSchema(**c.to_dict()) for c in er.passed_conditions
                ],
                failed_conditions=[
                    ConditionResultSchema(**c.to_dict()) for c in er.failed_conditions
                ],
                unverifiable_conditions=[
                    ConditionResultSchema(**c.to_dict()) for c in er.unverifiable_conditions
                ],
            )
        )

    # Aggregate counts
    pe_count = sum(1 for r in engine_results if r.verdict == EligibilityVerdict.POTENTIALLY_ELIGIBLE)
    nv_count = sum(1 for r in engine_results if r.verdict == EligibilityVerdict.NEEDS_VERIFICATION)
    ne_count = sum(1 for r in engine_results if r.verdict == EligibilityVerdict.NOT_ELIGIBLE)

    return EligibilityCheckResponse(
        profile_used=profile,
        schemes_evaluated=len(engine_results),
        potentially_eligible_count=pe_count,
        needs_verification_count=nv_count,
        not_eligible_count=ne_count,
        results=result_schemas,
    )
