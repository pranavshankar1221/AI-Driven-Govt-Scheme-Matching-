from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.ingestion_job import IngestionJob


class IngestionRepository:
    @staticmethod
    def create_job(db: Session, job_id: str, document_id: str) -> IngestionJob:
        job = IngestionJob(job_id=job_id, document_id=document_id, status="processing")
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def get_by_job_id(db: Session, job_id: str) -> Optional[IngestionJob]:
        return db.query(IngestionJob).filter(IngestionJob.job_id == job_id).first()

    @staticmethod
    def get_by_document_id(db: Session, document_id: str) -> Optional[IngestionJob]:
        return db.query(IngestionJob).filter(IngestionJob.document_id == document_id).order_by(IngestionJob.started_at.desc()).first()

    @staticmethod
    def update_job(db: Session, job_id: str, status: str, total_chunks: int = 0, error_message: Optional[str] = None) -> Optional[IngestionJob]:
        job = IngestionRepository.get_by_job_id(db, job_id)
        if job:
            job.status = status
            job.total_chunks = total_chunks
            job.error_message = error_message
            if status in ["completed", "failed"]:
                job.completed_at = datetime.utcnow()
            db.commit()
            db.refresh(job)
        return job
