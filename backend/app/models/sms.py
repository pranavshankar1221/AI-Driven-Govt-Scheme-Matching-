"""
Module: app/models/sms.py

SQLAlchemy database model for SMS messages sent to beneficiaries.
Stores masked phone numbers, delivery status, template version, and consent timestamps.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime
from app.core.database import Base


class SMSMessageModel(Base):
    __tablename__ = "sms_messages"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    idempotency_key = Column(String(128), unique=True, index=True, nullable=False)
    session_id = Column(String(50), index=True, nullable=False)
    phone_number_masked = Column(String(50), nullable=False)
    scheme_id = Column(String(100), index=True, nullable=False)
    template_version = Column(String(20), default="v1.0.0", nullable=False)
    provider_name = Column(String(50), default="mock", nullable=False)
    provider_message_id = Column(String(100), index=True, nullable=True)
    status = Column(String(20), default="queued", index=True, nullable=False)  # queued, sent, delivered, failed
    error_code = Column(String(50), nullable=True)
    error_message_safe = Column(Text, nullable=True)
    consent = Column(Boolean, default=True, nullable=False)
    sms_consent_at = Column(DateTime, nullable=True)
    content_summary = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
