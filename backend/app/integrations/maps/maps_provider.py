"""
Module: app/integrations/maps/maps_provider.py

Location provider abstraction for channel partner matching.

Design: pluggable provider so a real Maps/geocoding API can be connected later.
Default: MockLocationProvider (state/district normalization without external API).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings


@dataclass
class NormalizedLocation:
    """Normalized location information."""
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    display_name: Optional[str] = None
    resolved_by: str = "mock"  # "mock" | "maps_api" | "user_input"


class LocationProvider(ABC):
    """Abstract base for location/geocoding providers."""

    @abstractmethod
    def normalize(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        pincode: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> NormalizedLocation:
        """
        Normalize location inputs into a canonical NormalizedLocation.

        For future Maps API integration: latitude/longitude will be
        reverse-geocoded to state/district automatically.
        """
        ...


class MockLocationProvider(LocationProvider):
    """
    Mock location provider — normalizes state/district strings without
    calling any external API. GPS coordinates are accepted but not reverse-geocoded.
    """

    # State name normalization map (handles common abbreviations)
    STATE_ALIASES: dict = {
        "tn": "Tamil Nadu",
        "tamilnadu": "Tamil Nadu",
        "mh": "Maharashtra",
        "maharastra": "Maharashtra",
        "up": "Uttar Pradesh",
        "ka": "Karnataka",
        "kl": "Kerala",
        "ts": "Telangana",
        "ap": "Andhra Pradesh",
        "wb": "West Bengal",
        "gj": "Gujarat",
        "rj": "Rajasthan",
        "mp": "Madhya Pradesh",
        "br": "Bihar",
        "pb": "Punjab",
        "od": "Odisha",
        "or": "Odisha",
    }

    def normalize(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        pincode: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> NormalizedLocation:
        normalized_state = self._normalize_state(state) if state else None

        return NormalizedLocation(
            state=normalized_state,
            district=district.title() if district else None,
            pincode=pincode,
            latitude=latitude,
            longitude=longitude,
            display_name=self._build_display(normalized_state, district, pincode),
            resolved_by="user_input" if (state or district or pincode) else "mock",
        )

    def _normalize_state(self, state: str) -> str:
        cleaned = state.lower().strip().replace(" ", "")
        return self.STATE_ALIASES.get(cleaned, state.title())

    @staticmethod
    def _build_display(state, district, pincode) -> Optional[str]:
        parts = [p for p in [district, state, pincode] if p]
        return ", ".join(parts) if parts else None


def get_location_provider() -> LocationProvider:
    """Factory: return the configured location provider."""
    # Future: if MAPS_API_KEY is set, return a real provider
    return MockLocationProvider()
