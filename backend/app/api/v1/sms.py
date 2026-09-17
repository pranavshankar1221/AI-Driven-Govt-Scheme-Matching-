"""
Module: app/api/v1/sms.py

REST API Endpoints for Verified Scheme SMS Delivery & Status Webhooks.

Security & Architecture:
- Rejects arbitrary user-defined text payloads (accepts only structured scheme_id, session_id, phone_number, include_options).
- Rate-limited and validated against scheme registry.
- Supports provider webhooks for asynchronous delivery status updates.
"""

from __future__ import annotations
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status, Depends, Request

from app.services.sms_service import send_verified_scheme_sms, update_sms_delivery_status
from app.core.database import SessionLocal
from app.models.sms import SMSMessageModel

router = APIRouter(prefix="/sms", tags=["SMS Delivery"])


class SendSchemeSMSRequest(BaseModel):
    session_id: str = Field(..., description="Voice or chat session ID")
    phone_number: str = Field(..., description="Destination phone number (+91XXXXXXXXXX or 10-digit)")
    scheme_id: str = Field(..., description="Target verified scheme ID (e.g. PMEGP, MUDRA, PM-KISAN)")
    consent: bool = Field(True, description="Explicit user consent flag")
    include_options: Optional[Dict[str, bool]] = Field(None, description="Optional include toggles")


class SMSStatusResponse(BaseModel):
    message_id: str
    idempotency_key: str
    phone_number_masked: str
    scheme_id: str
    template_version: str
    provider_name: str
    status: str
    error_code: Optional[str] = None
    error_message_safe: Optional[str] = None
    consent: bool
    sms_consent_at: Optional[str] = None
    sent_at: Optional[str] = None
    delivered_at: Optional[str] = None


@router.post(
    "/send-scheme",
    status_code=status.HTTP_200_OK,
    summary="Send verified government scheme details via SMS",
    description=(
        "Generates a concise, verified scheme SMS directly from official database records. "
        "Strictly rejects arbitrary text payloads to prevent SMS relay abuse. "
        "Enforces SHA-256 idempotency key check to prevent duplicate messages on retries."
    )
)
async def send_scheme_sms(payload: SendSchemeSMSRequest) -> Dict[str, Any]:
    if not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMS delivery requires explicit user consent."
        )

    res = send_verified_scheme_sms(
        session_id=payload.session_id,
        phone_number=payload.phone_number,
        scheme_id=payload.scheme_id,
        consent=payload.consent,
        include_options=payload.include_options
    )

    if not res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res.get("error_message_safe", "SMS delivery failed.")
        )

    return res


@router.get(
    "/status/{message_id}",
    response_model=SMSStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve SMS delivery status",
    description="Returns delivery status, provider status, template version, and safe masked number details."
)
async def get_sms_status(message_id: str) -> SMSStatusResponse:
    db = SessionLocal()
    try:
        record = db.query(SMSMessageModel).filter(SMSMessageModel.id == message_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SMS record '{message_id}' not found."
            )

        return SMSStatusResponse(
            message_id=record.id,
            idempotency_key=record.idempotency_key,
            phone_number_masked=record.phone_number_masked,
            scheme_id=record.scheme_id,
            template_version=record.template_version,
            provider_name=record.provider_name,
            status=record.status,
            error_code=record.error_code,
            error_message_safe=record.error_message_safe,
            consent=record.consent,
            sms_consent_at=record.sms_consent_at.isoformat() if record.sms_consent_at else None,
            sent_at=record.sent_at.isoformat() if record.sent_at else None,
            delivered_at=record.delivered_at.isoformat() if record.delivered_at else None,
        )
    finally:
        db.close()


@router.post(
    "/webhook/status",
    status_code=status.HTTP_200_OK,
    summary="Webhook for SMS provider delivery status updates",
    description="Updates message status (sent -> delivered/failed) when status callbacks arrive from SMS provider."
)
async def sms_provider_webhook(request: Request) -> Dict[str, str]:
    try:
        data = await request.json()
    except Exception:
        data = dict(await request.form())

    provider_msg_id = data.get("MessageSid") or data.get("provider_message_id") or data.get("id")
    msg_status = data.get("MessageStatus") or data.get("status") or "delivered"
    error_code = data.get("ErrorCode") or data.get("error_code")

    if provider_msg_id:
        update_sms_delivery_status(provider_message_id=provider_msg_id, new_status=msg_status, error_code=error_code)
        return {"status": "success", "updated": "true"}

    return {"status": "ignored", "reason": "missing provider_message_id"}
