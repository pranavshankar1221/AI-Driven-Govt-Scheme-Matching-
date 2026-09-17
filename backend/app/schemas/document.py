from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DocumentBase(BaseModel):
    title: str
    organization: str
    source_url: Optional[str] = None
    scheme_id: Optional[str] = None
    document_type: str = "guideline"
    language: str = "en"
    version: str = "1.0"
    effective_date: Optional[str] = None
    publication_date: Optional[str] = None


class DocumentCreate(DocumentBase):
    file_path: str


class DocumentResponse(DocumentBase):
    id: int
    document_id: str
    file_hash: str
    page_count: int
    status: str
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ChunkMetadata(BaseModel):
    chunk_id: str
    document_id: str
    scheme_id: Optional[str] = None
    organization: str
    scheme_name: Optional[str] = None
    document_type: str = "guideline"
    language: str = "en"
    page_start: int
    page_end: int
    section: Optional[str] = None
    heading_path: Optional[List[str]] = None
    chunk_type: str = "semantic"
    effective_date: Optional[str] = None
    version: str = "1.0"
    source_url: Optional[str] = None
    content_hash: str


class DocumentChunkResponse(BaseModel):
    chunk_id: str
    document_id: str
    scheme_id: Optional[str] = None
    parent_chunk_id: Optional[str] = None
    chunk_index: int
    page_start: int
    page_end: int
    section: Optional[str] = None
    chunk_type: str
    text: str
    token_count: int
    metadata: Dict[str, Any]


# ── Schemas for Document Requirement Check Service ───────────────────────

class DocumentEntry(BaseModel):
    name: str
    description: Optional[str] = None
    requirement_type: str = "required"  # required, optional, conditional


class DocumentCheckRequest(BaseModel):
    scheme_id: str
    profile: Optional[Dict[str, Any]] = None


class DocumentCheckResponse(BaseModel):
    scheme_id: str
    scheme_name: str
    required_documents: List[DocumentEntry] = Field(default_factory=list)
    optional_documents: List[DocumentEntry] = Field(default_factory=list)
    conditional_documents: List[DocumentEntry] = Field(default_factory=list)
    already_known: List[str] = Field(default_factory=list)
    missing_documents: List[str] = Field(default_factory=list)
    note: Optional[str] = None
