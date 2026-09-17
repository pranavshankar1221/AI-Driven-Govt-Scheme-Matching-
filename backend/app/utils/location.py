"""
Module: app/utils/location.py

Location utility: normalize and validate location inputs.
Delegates to the configured location provider.
"""

from __future__ import annotations

from typing import Optional

from app.integrations.maps.maps_provider import NormalizedLocation, get_location_provider


def normalize_location(
    state: Optional[str] = None,
    district: Optional[str] = None,
    pincode: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> NormalizedLocation:
    """
    Normalize location inputs to canonical form.

    Args:
        state:     Indian state name or abbreviation.
        district:  District name.
        pincode:   PIN code (6-digit string).
        latitude:  GPS latitude (future Maps API use).
        longitude: GPS longitude (future Maps API use).

    Returns:
        NormalizedLocation with canonical state/district names.
    """
    provider = get_location_provider()
    return provider.normalize(
        state=state,
        district=district,
        pincode=pincode,
        latitude=latitude,
        longitude=longitude,
    )
