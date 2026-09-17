"""
Module: app/services/scheme_service.py

Scheme metadata service.
Retrieves scheme details from the eligibility rules registry.
"""

from __future__ import annotations

from typing import Optional

from app.ai.eligibility.rules import SchemeEligibilityRules
from app.services.eligibility_service import get_registry


def get_scheme_details(scheme_id: str) -> Optional[SchemeEligibilityRules]:
    """
    Get full scheme rules and metadata by scheme ID.

    Args:
        scheme_id: Unique scheme identifier (e.g., 'PM_KISAN').

    Returns:
        SchemeEligibilityRules or None if not found.
    """
    registry = get_registry()
    return registry.get(scheme_id)


def list_all_schemes() -> list:
    """Return a list of all loaded scheme IDs and names."""
    registry = get_registry()
    return [
        {"scheme_id": s.scheme_id, "scheme_name": s.scheme_name, "ministry": s.ministry}
        for s in registry.all()
    ]
