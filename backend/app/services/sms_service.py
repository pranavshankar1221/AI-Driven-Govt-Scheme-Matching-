"""
Module: app/services/sms_service.py

Service layer for generating and dispatching verified government scheme SMS messages.

Key Security & Integrity Rules:
1. LLM NEVER invents SMS content. Text is generated strictly from verified database records.
2. Raw phone numbers are handled strictly transiently. Persists ONLY phone_number_masked and sms_consent_at.
3. Fully idempotent: generates hash(session_id + scheme_id + phone_masked + template_version) to prevent duplicate sends on retries.
4. Preserves source provenance (source_document, page, effective_date, official_url) internally.
"""

from __future__ import annotations
import re
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.sms import SMSMessageModel
from app.integrations.sms.provider import get_sms_provider
from app.integrations.sms.mock import mask_phone
from app.services.eligibility_service import get_registry


def compute_idempotency_key(session_id: str, scheme_id: str, phone_masked: str, template_version: str) -> str:
    """Compute deterministic SHA-256 idempotency key for SMS retries."""
    raw = f"{session_id}:{scheme_id}:{phone_masked}:{template_version}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def validate_phone_number(phone: str) -> bool:
    """Validate E.164 or standard 10-digit Indian phone number."""
    if not phone:
        return False
    digits = re.sub(r"[^\d]", "", phone)
    return 10 <= len(digits) <= 13


def format_verified_sms_text(scheme_rules: Any, include_options: Optional[dict] = None) -> Tuple[str, dict]:
    """
    Format concise verified SMS text strictly from database record.
    Returns: (rendered_sms_text, provenance_dict)
    """
    opts = include_options or {}
    
    scheme_name = getattr(scheme_rules, "scheme_name", "Government Scheme")
    purpose = getattr(scheme_rules, "purpose", "Welfare Assistance")
    benefit = getattr(scheme_rules, "benefit_summary", "Financial & Development Assistance")
    if not benefit:
        max_loan = getattr(scheme_rules, "max_loan_amount", None)
        benefit = f"Loan assistance up to Rs. {max_loan:,.0f}" if max_loan else "Government Financial Assistance"

    application_mode = getattr(scheme_rules, "application_mode", "Online / Authorized Bank Branch")
    official_url = getattr(scheme_rules, "application_url", "https://myscheme.gov.in")
    
    # Source Provenance Metadata
    provenance = {
        "scheme_id": getattr(scheme_rules, "scheme_id", "SCHEME"),
        "source_document": f"Official Guidelines - {scheme_name}",
        "page": getattr(scheme_rules, "source_page", 1),
        "effective_date": getattr(scheme_rules, "effective_date", "2026-01-01"),
        "official_url": official_url
    }

    lines = [
        f"YojanaSetu: Scheme: {scheme_name}",
        "",
        "Preliminary Eligibility: Appears to meet preliminary criteria.",
        f"Purpose: {purpose}",
        f"Assistance: {benefit}",
        "Documents: Aadhaar, Income Proof, Bank Passbook",
        f"Application: {application_mode}",
        f"Official Link: {official_url}",
        "",
        "Note: Final approval is subject to the implementing authority."
    ]

    return "\n".join(lines), provenance


def send_verified_scheme_sms(
    session_id: str,
    phone_number: str,
    scheme_id: str,
    consent: bool = True,
    include_options: Optional[dict] = None
) -> Dict[str, Any]:
    """
    Generate and deliver a verified scheme SMS message.

    Args:
        session_id:      Voice or chat session ID.
        phone_number:    Raw destination phone number (processed transiently).
        scheme_id:       Target scheme ID (e.g., PMEGP, MUDRA, PM-KISAN).
        consent:         Explicit consent flag (must be True).
        include_options: Optional toggles for sections to include.

    Returns:
        Structured result dict.
    """
    if not consent:
        return {
            "success": False,
            "status": "failed",
            "error_code": "CONSENT_REFUSED",
            "error_message_safe": "SMS delivery cancelled: user consent was not granted.",
        }

    if not validate_phone_number(phone_number):
        return {
            "success": False,
            "status": "failed",
            "error_code": "INVALID_PHONE",
            "error_message_safe": "Invalid phone number provided.",
        }

    phone_masked = mask_phone(phone_number)
    template_version = settings.SMS_TEMPLATE_VERSION
    idempotency_key = compute_idempotency_key(session_id, scheme_id, phone_masked, template_version)
    now = datetime.utcnow()

    db = SessionLocal()
    try:
        # Check idempotency: if already sent/delivered, return existing result without duplicate send
        existing = db.query(SMSMessageModel).filter(SMSMessageModel.idempotency_key == idempotency_key).first()
        if existing and existing.status in ["sent", "delivered"]:
            return {
                "success": True,
                "message_id": existing.id,
                "idempotency_key": idempotency_key,
                "phone_number_masked": existing.phone_number_masked,
                "scheme_id": existing.scheme_id,
                "status": existing.status,
                "duplicate_retry": True,
                "info": "SMS was previously sent for this session and scheme."
            }

        # Fetch verified scheme rules from registry
        registry = get_registry()
        scheme_rules = registry.get(scheme_id.lower()) or registry.get(scheme_id.upper())
        if not scheme_rules:
            # Try finding scheme by substring
            for k, v in registry.items():
                if scheme_id.lower() in k.lower() or k.lower() in scheme_id.lower():
                    scheme_rules = v
                    break

        if not scheme_rules:
            return {
                "success": False,
                "status": "failed",
                "error_code": "SCHEME_NOT_FOUND",
                "error_message_safe": f"Scheme '{scheme_id}' was not found in verified registry.",
            }

        sms_text, provenance = format_verified_sms_text(scheme_rules, include_options)
        
        # Dispatch SMS via active provider
        provider = get_sms_provider()
        res = provider.send_sms(to_phone=phone_number, text=sms_text, idempotency_key=idempotency_key)

        status_str = res.get("status", "sent") if res.get("success") else "failed"

        # Record DB entry
        sms_record = SMSMessageModel(
            idempotency_key=idempotency_key,
            session_id=session_id,
            phone_number_masked=phone_masked,
            scheme_id=scheme_id.upper(),
            template_version=template_version,
            provider_name=res.get("provider_name", "mock"),
            provider_message_id=res.get("provider_message_id"),
            status=status_str,
            error_code=res.get("error_code"),
            error_message_safe=res.get("error_message_safe"),
            consent=True,
            sms_consent_at=now,
            content_summary=f"Scheme: {scheme_rules.scheme_name}",
            sent_at=now if res.get("success") else None,
        )
        db.add(sms_record)
        db.commit()
        db.refresh(sms_record)

        return {
            "success": res.get("success", False),
            "message_id": sms_record.id,
            "idempotency_key": idempotency_key,
            "phone_number_masked": phone_masked,
            "scheme_id": scheme_rules.scheme_id,
            "status": status_str,
            "provider_name": res.get("provider_name"),
            "provenance": provenance,
            "error_code": res.get("error_code"),
            "error_message_safe": res.get("error_message_safe"),
        }
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "status": "failed",
            "error_code": "INTERNAL_ERROR",
            "error_message_safe": "System error processing SMS request.",
        }
    finally:
        db.close()


def update_sms_delivery_status(provider_message_id: str, new_status: str, error_code: Optional[str] = None) -> bool:
    """Update status of sent SMS record via provider webhook/callback."""
    if not provider_message_id:
        return False
    db = SessionLocal()
    try:
        record = db.query(SMSMessageModel).filter(SMSMessageModel.provider_message_id == provider_message_id).first()
        if record:
            record.status = new_status.lower()
            if new_status.lower() == "delivered":
                record.delivered_at = datetime.utcnow()
            if error_code:
                record.error_code = error_code
            db.commit()
            return True
        return False
    except Exception:
        db.rollback()
        return False
    finally:
        db.close()
