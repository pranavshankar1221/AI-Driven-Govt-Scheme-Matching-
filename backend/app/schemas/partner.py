"""
Module: app/schemas/partner.py

Pydantic I/O schemas for the channel partner matching service.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class PartnerSearchRequest(BaseModel):
    """Input for channel partner search."""
    state: Optional[str] = Field(None, description="State name (e.g., 'Tamil Nadu').")
    district: Optional[str] = Field(None, description="District name (e.g., 'Salem').")
    pincode: Optional[str] = Field(None, description="Pincode for nearest-partner matching.")
    scheme_id: Optional[str] = Field(None, description="Scheme ID to filter compatible partners.")
    category: Optional[str] = Field(None, description="Beneficiary category (SC/ST/OBC/General).")
    financing_required: Optional[bool] = Field(
        None, description="If True, prefer partners that provide financing."
    )
    latitude: Optional[float] = Field(None, description="GPS latitude (for future Maps integration).")
    longitude: Optional[float] = Field(None, description="GPS longitude (for future Maps integration).")


class PartnerResult(BaseModel):
    """A single channel partner result."""
    partner_id: str
    name: str
    partner_type: str = Field(
        ...,
        description="Type: State_Channelizing_Agency | Public_Sector_Bank | RRB | NBFC_MFI | Other"
    )
    state: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    website: Optional[str] = None
    compatible_schemes: List[str] = Field(default_factory=list)
    financing_available: bool = False
    suitability_score: Optional[int] = Field(
        None, ge=0, le=100,
        description="Computed suitability score (0-100) based on location and scheme match."
    )
    distance_note: Optional[str] = Field(
        None, description="Approximate distance note (requires location data)."
    )


class PartnerSearchResponse(BaseModel):
    """Channel partner search results."""
    query: PartnerSearchRequest
    total_found: int
    location_matching: bool = Field(
        ...,
        description="True if location-based filtering was applied."
    )
    partners: List[PartnerResult] = Field(default_factory=list)
    note: Optional[str] = Field(
        None,
        description="Advisory note (e.g., 'Exact GPS-based distance requires Maps API integration')."
    )
