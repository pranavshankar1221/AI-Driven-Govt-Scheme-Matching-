import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=True)
    organization = Column(String(100), nullable=False, index=True)
    scheme_id = Column(String(100), nullable=True, index=True)
    document_type = Column(String(50), default="guideline")  # guideline, application_form, compendium, policy
    language = Column(String(10), default="en")
    version = Column(String(50), default="1.0")
    effective_date = Column(String(50), nullable=True)
    publication_date = Column(String(50), nullable=True)
    last_verified_at = Column(DateTime, default=datetime.datetime.utcnow)
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    page_count = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # pending, processing, active, archived, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
