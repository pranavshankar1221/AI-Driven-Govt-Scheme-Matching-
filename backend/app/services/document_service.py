"""
Module: app/services/document_service.py

Document requirement service.
Loads document requirements from data/documents/scheme_documents.json
and cross-checks against the beneficiary profile.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.schemas.chat import BeneficiaryProfile
from app.schemas.document import DocumentCheckRequest, DocumentCheckResponse, DocumentEntry
from app.services.eligibility_service import get_registry


# ── Document Registry Loader ──────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_document_registry() -> Dict[str, Any]:
    """Load scheme_documents.json once and cache."""
    data_path = Path(__file__).parent.parent.parent / "data" / "documents" / "scheme_documents.json"
    if not data_path.exists():
        return {}
    with open(data_path, encoding="utf-8") as f:
        records = json.load(f)
    return {r["scheme_id"]: r for r in records}


def get_document_requirements(
    scheme_id: str,
    profile: Optional[BeneficiaryProfile] = None,
) -> DocumentCheckResponse:
    """
    Get document requirements for a scheme.

    Args:
        scheme_id: Scheme identifier (e.g., 'PM_KISAN').
        profile:   Optional profile to determine pre-confirmed documents.

    Returns:
        DocumentCheckResponse with required/optional/conditional lists.

    Raises:
        ValueError: If scheme_id is not found.
    """
    scheme_id_upper = scheme_id.upper()
    registry = _load_document_registry()

    # Fallback: build generic doc list from scheme rules if JSON not available
    if scheme_id_upper not in registry:
        rules_registry = get_registry()
        rules = rules_registry.get(scheme_id_upper)
        if rules is None:
            raise ValueError(f"Scheme '{scheme_id}' not found in document registry.")
        return DocumentCheckResponse(
            scheme_id=scheme_id_upper,
            scheme_name=rules.scheme_name,
            required_documents=[
                DocumentEntry(name="Aadhaar Card", description="Identity proof", requirement_type="required"),
                DocumentEntry(name="Bank Passbook", description="Bank account for DBT", requirement_type="required"),
            ],
            note="Detailed document list not available. Contact the scheme ministry for exact requirements.",
        )

    record = registry[scheme_id_upper]
    required_docs = [DocumentEntry(**d) for d in record.get("required_documents", [])]
    optional_docs = [DocumentEntry(**d) for d in record.get("optional_documents", [])]
    conditional_docs = [DocumentEntry(**d) for d in record.get("conditional_documents", [])]

    # Determine which documents the user might already have (profile-inferred)
    already_known = _infer_available_docs(profile) if profile else []
    missing = [d.name for d in required_docs if d.name not in already_known]

    return DocumentCheckResponse(
        scheme_id=scheme_id_upper,
        scheme_name=record.get("scheme_name", scheme_id_upper),
        required_documents=required_docs,
        optional_documents=optional_docs,
        conditional_documents=conditional_docs,
        already_known=already_known,
        missing_documents=missing,
        note=record.get("note"),
    )


def _infer_available_docs(profile: BeneficiaryProfile) -> List[str]:
    """
    Infer which documents a beneficiary is likely to have based on profile.
    This is advisory only — not a guarantee.
    """
    available = []
    if profile.category in ("SC", "ST"):
        available.append("Aadhaar Card")  # Required for most social schemes
    if profile.annual_income is not None:
        available.append("Income Certificate")
    return available
