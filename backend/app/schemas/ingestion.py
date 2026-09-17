from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class IngestionRequest(BaseModel):
    title: str
    organization: str
    scheme_id: Optional[str] = None
    source_url: Optional[str] = None
    language: str = "en"
    version: str = "1.0"
    effective_date: Optional[str] = None
    document_type: str = "guideline"


class IngestionStatusResponse(BaseModel):
    job_id: str
    document_id: str
    status: str
    total_chunks: int
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None


class ReindexRequest(BaseModel):
    force_reembed: bool = False
    scheme_id: Optional[str] = None
