"""
Module: app/api/v1/partners.py

Channel partner matching endpoint.
"""

from typing import Optional
from fastapi import APIRouter, Query, status

from app.schemas.partner import PartnerSearchRequest, PartnerSearchResponse
from app.services.partner_service import find_partners

router = APIRouter(prefix="/partners", tags=["Channel Partners"])


@router.get(
    "/nearby",
    response_model=PartnerSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Find nearby channel partners for a scheme",
    description=(
        "Returns channel partners (banks, NBFCs, CSCs) filtered by state, district, "
        "and scheme compatibility. Results are sorted by suitability score. "
        "Connect a Maps API for GPS-based distance ranking."
    )
)
async def find_nearby_partners(
    state: Optional[str] = Query(None, description="Indian state name"),
    district: Optional[str] = Query(None, description="District name"),
    pincode: Optional[str] = Query(None, description="6-digit PIN code"),
    scheme_id: Optional[str] = Query(None, description="Scheme ID to filter by"),
    category: Optional[str] = Query(None, description="Beneficiary category (SC/ST/OBC)"),
    financing_required: Optional[bool] = Query(None, description="Only show financing partners"),
    latitude: Optional[float] = Query(None, description="GPS latitude"),
    longitude: Optional[float] = Query(None, description="GPS longitude"),
) -> PartnerSearchResponse:
    request = PartnerSearchRequest(
        state=state,
        district=district,
        pincode=pincode,
        scheme_id=scheme_id,
        category=category,
        financing_required=financing_required,
        latitude=latitude,
        longitude=longitude,
    )
    return find_partners(request)


@router.post(
    "/search",
    response_model=PartnerSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search channel partners with full filter options (POST variant)",
    description="POST version of /partners/nearby for complex filter objects."
)
async def search_partners(payload: PartnerSearchRequest) -> PartnerSearchResponse:
    return find_partners(payload)
