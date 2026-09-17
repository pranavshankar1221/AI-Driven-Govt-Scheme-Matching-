import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.ingestion import IngestionStatusResponse, ReindexRequest
from app.rag.pipeline.ingest import IngestionPipeline
from app.repositories.ingestion_repository import IngestionRepository
from app.core.config import settings

router = APIRouter(prefix="/ingestion", tags=["Document Ingestion"])


@router.post("/upload")
def upload_and_ingest(
    file: UploadFile = File(...),
    title: str = Form(...),
    organization: str = Form(...),
    scheme_id: str = Form(""),
    source_url: str = Form(""),
    document_type: str = Form("guideline"),
    language: str = Form("en"),
    version: str = Form("1.0"),
    effective_date: str = Form(""),
    db: Session = Depends(get_db),
):
    """Upload official PDF document and trigger pipeline ingestion."""
    os.makedirs(settings.OFFICIAL_DOCS_DIR, exist_ok=True)
    file_path = os.path.join(settings.OFFICIAL_DOCS_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pipeline = IngestionPipeline(db)
    result = pipeline.process_document(
        file_path=file_path,
        title=title,
        organization=organization,
        scheme_id=scheme_id,
        source_url=source_url,
        document_type=document_type,
        language=language,
        version=version,
        effective_date=effective_date,
    )
    return result


@router.get("/status/{document_id}", response_model=IngestionStatusResponse)
def get_ingestion_status(document_id: str, db: Session = Depends(get_db)):
    """Retrieve document ingestion job status and telemetry."""
    job = IngestionRepository.get_by_document_id(db, document_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingestion job not found")
    return job
