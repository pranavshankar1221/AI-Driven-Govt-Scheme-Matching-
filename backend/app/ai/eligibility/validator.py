"""
Module: app/ai/eligibility/validator.py

Profile completeness validator for the eligibility engine.

Inspects a BeneficiaryProfile and determines which fields required
by a scheme's rule-set are present vs. missing. Missing required fields
cause the overall result to shift from 'potentially_eligible' to
'needs_verification'.

NO LLM is involved — this is pure structural validation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Set

from app.schemas.chat import BeneficiaryProfile
from app.ai.eligibility.rules import EligibilityCondition, SchemeEligibilityRules


@dataclass
class ProfileValidationResult:
    """
    Result of inspecting a beneficiary profile against the fields
    required by a scheme's conditions.
    """
    present_fields: Set[str] = field(default_factory=set)
    missing_required_fields: Set[str] = field(default_factory=set)
    missing_optional_fields: Set[str] = field(default_factory=set)

    @property
    def is_complete_for_required(self) -> bool:
        """True if every *required* condition field is present in the profile."""
        return len(self.missing_required_fields) == 0


def get_profile_value(profile: BeneficiaryProfile, field_name: str) -> Any:
    """
    Safely retrieve a named field from BeneficiaryProfile.

    Returns None if the field doesn't exist or its value is None.
    Field names are matched case-insensitively.
    """
    field_name_lower = field_name.lower().strip()
    # Access model_fields on the class (Pydantic V2 compatible)
    for attr in type(profile).model_fields:
        if attr.lower() == field_name_lower:
            return getattr(profile, attr, None)
    return None


def validate_profile_completeness(
    profile: BeneficiaryProfile,
    scheme_rules: SchemeEligibilityRules,
) -> ProfileValidationResult:
    """
    Inspect which condition fields are populated in the profile
    for the given scheme's rules.

    Args:
        profile:       Extracted beneficiary profile.
        scheme_rules:  Loaded scheme eligibility rules.

    Returns:
        ProfileValidationResult with sets of present/missing fields.
    """
    result = ProfileValidationResult()
    seen_fields: Set[str] = set()  # avoid double-counting same field

    for condition in scheme_rules.conditions:
        f = condition.field
        if f in seen_fields:
            continue
        seen_fields.add(f)

        val = get_profile_value(profile, f)
        if val is not None:
            result.present_fields.add(f)
        else:
            if condition.required:
                result.missing_required_fields.add(f)
            else:
                result.missing_optional_fields.add(f)

    return result


def build_profile_dict(profile: BeneficiaryProfile) -> Dict[str, Any]:
    """
    Convert BeneficiaryProfile to a plain dict (None values excluded).
    Used by the evaluator to look up field values by name.
    """
    return {k: v for k, v in profile.model_dump().items() if v is not None}
