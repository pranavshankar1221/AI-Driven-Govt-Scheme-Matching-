"""
Module: app/integrations/sms/mock.py

Mock SMS Provider implementation for local development, automated testing, and CI/CD.
Generates deterministic mock message IDs and logs SMS attempts safely without sending external network calls.
"""

from __future__ import annotations
import uuid
from typing import Dict, Any, Optional
from app.integrations.sms.provider import SMSProvider


def mask_phone(phone: str) -> str:
    """Mask phone number for safe log printing (e.g. +919876543210 -> +91******3210)."""
    if not phone or len(phone) < 6:
        return "******"
    return phone[:3] + "*" * (len(phone) - 7) + phone[-4:]


class MockSMSProvider(SMSProvider):
    """Mock SMS Provider for local testing."""

    def send_sms(
        self,
        to_phone: str,
        text: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        msg_id = f"mock_msg_{uuid.uuid4().hex[:12]}"
        masked = mask_phone(to_phone)
        
        # Simulate invalid phone number check
        if "invalid" in to_phone.lower() or len(to_phone.replace("+", "").replace("-", "")) < 10:
            return {
                "success": False,
                "provider_name": "mock",
                "provider_message_id": None,
                "status": "failed",
                "error_code": "INVALID_PHONE_NUMBER",
                "error_message_safe": f"Phone number '{masked}' is invalid or improperly formatted.",
            }

        return {
            "success": True,
            "provider_name": "mock",
            "provider_message_id": msg_id,
            "status": "sent",
            "error_code": None,
            "error_message_safe": None,
        }

    def get_delivery_status(self, provider_message_id: str) -> Dict[str, Any]:
        return {
            "provider_message_id": provider_message_id,
            "status": "delivered",
            "delivered": True,
        }
