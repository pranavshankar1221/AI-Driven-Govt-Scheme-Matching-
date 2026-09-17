"""
Module: app/integrations/sms/provider.py

SMS Provider abstraction interface.
All SMS providers (Twilio, Mock, etc.) implement this interface.
Business logic NEVER calls a specific provider directly.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.core.config import settings


class SMSProvider(ABC):
    """Abstract Base Class for SMS Providers."""

    @abstractmethod
    def send_sms(
        self,
        to_phone: str,
        text: str,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an SMS to a phone number.

        Args:
            to_phone: Destination phone number (E.164 format, e.g. +919876543210).
            text: SMS body text.
            idempotency_key: Unique idempotency key to prevent duplicate sends.

        Returns:
            Dict containing:
              - success: bool
              - provider_name: str
              - provider_message_id: Optional[str]
              - status: str ("sent", "queued", "failed")
              - error_code: Optional[str]
              - error_message_safe: Optional[str]
        """
        ...

    @abstractmethod
    def get_delivery_status(self, provider_message_id: str) -> Dict[str, Any]:
        """Query delivery status from SMS provider."""
        ...


def get_sms_provider() -> SMSProvider:
    """
    Factory: returns configured SMS provider instance based on settings.SMS_PROVIDER.
    """
    provider_name = settings.SMS_PROVIDER.lower()

    if provider_name == "twilio" and settings.SMS_API_KEY:
        from app.integrations.sms.twilio import TwilioSMSProvider
        return TwilioSMSProvider()

    from app.integrations.sms.mock import MockSMSProvider
    return MockSMSProvider()
