"""
Module: app/services/partner_service.py

Channel partner matching service.

Loads channel_partners.json and filters by state, district, scheme compatibility.
Location-based scoring (nearest first) is approximate without a real Maps API.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.schemas.partner import PartnerResult, PartnerSearchRequest, PartnerSearchResponse
from app.utils.location import normalize_location


@lru_cache(maxsize=1)
def _load_partners() -> List[Dict[str, Any]]:
    """Load channel_partners.json once and cache."""
    data_path = Path(__file__).parent.parent.parent / "data" / "partners" / "channel_partners.json"
    if not data_path.exists():
        return []
    with open(data_path, encoding="utf-8") as f:
        return json.load(f)


def find_partners(request: PartnerSearchRequest) -> PartnerSearchResponse:
    """
    Find channel partners matching the given location and scheme.

    Args:
        request: PartnerSearchRequest with optional state, district, scheme_id.

    Returns:
        PartnerSearchResponse with filtered and scored partner list.
    """
    all_partners = _load_partners()

    # Normalize location input
    normalized = normalize_location(
        state=request.state,
        district=request.district,
        pincode=request.pincode,
        latitude=request.latitude,
        longitude=request.longitude,
    )
    location_matching = bool(normalized.state or normalized.district or normalized.pincode)

    results: List[PartnerResult] = []

    for raw in all_partners:
        score = _compute_partner_score(raw, normalized, request.scheme_id, request.financing_required)
        if score is None:
            continue  # Filtered out

        result = PartnerResult(
            partner_id=raw["partner_id"],
            name=raw["name"],
            partner_type=raw["partner_type"],
            state=raw.get("state"),
            district=raw.get("district"),
            address=raw.get("address"),
            contact_phone=raw.get("contact_phone"),
            contact_email=raw.get("contact_email"),
            website=raw.get("website"),
            compatible_schemes=raw.get("compatible_schemes", []),
            financing_available=raw.get("financing_available", False),
            suitability_score=score,
        )
        results.append(result)

    # Sort by suitability score descending
    results.sort(key=lambda p: (p.suitability_score or 0), reverse=True)

    return PartnerSearchResponse(
        query=request,
        total_found=len(results),
        location_matching=location_matching,
        partners=results,
        note=(
            "Distance shown is approximate. "
            "Enable GPS location for exact nearest-partner matching."
            if location_matching else
            "Showing all available partners. Provide state/district for location-based results."
        ),
    )


def _compute_partner_score(
    partner: Dict[str, Any],
    location,
    scheme_id: Optional[str],
    financing_required: Optional[bool],
) -> Optional[int]:
    """
    Compute suitability score for a partner.

    Returns:
        Integer score (0-100), or None to exclude the partner.
    """
    score = 50  # Base score

    # Scheme match (strong signal)
    if scheme_id:
        compatible = partner.get("compatible_schemes", [])
        if scheme_id.upper() not in [s.upper() for s in compatible]:
            return None  # Exclude: incompatible scheme
        score += 30

    # Financing requirement
    if financing_required is True and not partner.get("financing_available", False):
        return None  # Exclude: financing required but not available

    # Location match
    partner_state = (partner.get("state") or "").strip().lower()
    partner_district = (partner.get("district") or "").strip().lower()

    if location.state and partner_state and partner_state not in ("all india", ""):
        if location.state.lower() in partner_state or partner_state in location.state.lower():
            score += 15
        else:
            score -= 20  # Different state

    if location.district and partner_district:
        if location.district.lower() in partner_district or partner_district in location.district.lower():
            score += 10

    # "All India" partners get a neutral score
    if partner_state == "all india":
        score += 5

    return max(0, min(100, score))
