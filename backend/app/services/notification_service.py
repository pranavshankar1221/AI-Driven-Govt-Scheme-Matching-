"""
Module: app/services/notification_service.py

Notification service stub.
Placeholder for SMS/push notification integration.
"""

from __future__ import annotations

from typing import Optional


class NotificationService:
    """Stub notification service. Connect SMS/push provider here."""

    @staticmethod
    def send_sms(phone: str, message: str) -> bool:
        """
        Send an SMS notification.
        Stub: logs only. Connect Twilio/AWS SNS/Exotel here.
        """
        # Never log full phone numbers in production
        masked = phone[:3] + "****" + phone[-2:] if len(phone) >= 5 else "****"
        print(f"[NotificationService] SMS to {masked}: {message[:50]}...")
        return True

    @staticmethod
    def send_push(device_token: str, title: str, body: str) -> bool:
        """
        Send a push notification.
        Stub: connect Firebase FCM here.
        """
        print(f"[NotificationService] Push: {title} — {body[:50]}...")
        return True
