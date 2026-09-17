import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(100), unique=True, index=True, nullable=False)
    document_id = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="queued")  # queued, processing, completed, failed
    total_chunks = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
