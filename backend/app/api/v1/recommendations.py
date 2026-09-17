"""
Module: app/api/v1/recommendations.py

Scheme recommendation endpoint.
"""

from fastapi import APIRouter, status

from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import get_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post(
    "",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ranked government scheme recommendations",
    description=(
        "Runs the eligibility engine + suitability scorer for the given profile. "
        "Returns schemes ranked by verdict (eligible first) then by score (0–100). "
        "All scoring is deterministic — no LLM."
    )
)
async def recommend_schemes(payload: RecommendationRequest) -> RecommendationResponse:
    return get_recommendations(profile=payload.profile, scheme_ids=payload.scheme_ids, top_n=payload.top_n)
