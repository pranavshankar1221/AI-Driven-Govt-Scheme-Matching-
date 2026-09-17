"""
Module: app/integrations/sms/twilio.py

Twilio SMS Provider implementation.
Activated when SMS_PROVIDER="twilio" and SMS_API_KEY is configured.
"""

from __future__ import annotations
from typing import Dict, Any, Optional
import requests
from app.core.config import settings
from app.integrations.sms.provider import SMSProvider
from app.integrations.sms.mock import mask_phone


class TwilioSMSProvider(SMSProvider):
    """Twilio SMS Provider via HTTP API."""

    def __init__(self) -> None:
        self.account_sid = settings.SMS_API_KEY
        self.auth_token = settings.SMS_API_SECRET
        self.from_number = settings.SMS_FROM_NUMBER or "+18005550199"

    def send_sms(
        self,
        to_phone: str,
        text: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        masked = mask_phone(to_phone)
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        
        payload = {
            "To": to_phone,
            "From": self.from_number,
            "Body": text,
        }

        try:
            res = requests.post(url, data=payload, auth=(self.account_sid, self.auth_token), timeout=15)
            if res.status_code in [200, 201]:
                data = res.json()
                return {
                    "success": True,
                    "provider_name": "twilio",
                    "provider_message_id": data.get("sid"),
                    "status": "sent" if data.get("status") in ["sent", "queued"] else "failed",
                    "error_code": None,
                    "error_message_safe": None,
                }
            
            error_data = res.json() if res.headers.get("content-type") == "application/json" else {}
            return {
                "success": False,
                "provider_name": "twilio",
                "provider_message_id": None,
                "status": "failed",
                "error_code": str(error_data.get("code", "TWILIO_ERROR")),
                "error_message_safe": f"SMS delivery failed for number {masked}.",
            }
        except Exception as e:
            return {
                "success": False,
                "provider_name": "twilio",
                "provider_message_id": None,
                "status": "failed",
                "error_code": "NETWORK_ERROR",
                "error_message_safe": f"Unable to reach SMS gateway for {masked}.",
            }

    def get_delivery_status(self, provider_message_id: str) -> Dict[str, Any]:
        if not provider_message_id:
            return {"status": "unknown", "delivered": False}
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages/{provider_message_id}.json"
        try:
            res = requests.get(url, auth=(self.account_sid, self.auth_token), timeout=10)
            if res.status_code == 200:
                data = res.json()
                st = data.get("status", "").lower()
                return {
                    "provider_message_id": provider_message_id,
                    "status": "delivered" if st == "delivered" else st,
                    "delivered": st == "delivered",
                }
        except Exception:
            pass
        return {"status": "unknown", "delivered": False}
