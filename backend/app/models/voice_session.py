"""
Module: app/models/voice_session.py

SQLAlchemy database model for Voice Call Sessions.
Stores session metadata, masked phone numbers, dedicated scheme & eligibility columns for dashboards,
and collected profiles for Web + Phone continuity.
"""

import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.core.database import Base


class VoiceSessionModel(Base):
    __tablename__ = "voice_sessions"

    session_id = Column(String(50), primary_key=True)
    conversation_id = Column(String(50), index=True, nullable=False)
    phone_number_masked = Column(String(50), nullable=True)
    detected_language = Column(String(20), default="en-IN")
    
    # Dedicated query fields for dashboard analytics
    selected_scheme_id = Column(String(100), index=True, nullable=True)
    eligibility_status = Column(String(50), index=True, nullable=True)

    profile_json = Column(Text, nullable=True)
    recommendations_json = Column(Text, nullable=True)
    transcript_json = Column(Text, nullable=True)
    duration_seconds = Column(Integer, default=0)
    status = Column(String(30), default="completed")
    
    sms_requested = Column(Boolean, default=False)
    sms_sent = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
