"""
Module: app/api/v1/documents.py

Document requirement check endpoint.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status

from app.schemas.document import DocumentCheckRequest, DocumentCheckResponse
from app.schemas.chat import BeneficiaryProfile
from app.services.document_service import get_document_requirements

router = APIRouter(prefix="/documents", tags=["Document Requirements"])


@router.post(
    "/check",
    response_model=DocumentCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Get document requirements for a government scheme",
    description=(
        "Returns the list of required, optional, and conditional documents "
        "for a given scheme. Optionally cross-checks against the beneficiary profile "
        "to identify already-confirmed and missing documents."
    )
)
async def check_documents(payload: DocumentCheckRequest) -> DocumentCheckResponse:
    try:
        return get_document_requirements(scheme_id=payload.scheme_id, profile=payload.profile)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
