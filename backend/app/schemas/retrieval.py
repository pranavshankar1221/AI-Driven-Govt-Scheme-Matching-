from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class RetrievalFilter(BaseModel):
    scheme_id: Optional[str] = None
    organization: Optional[str] = None
    chunk_type: Optional[str] = None
    language: Optional[str] = None
    document_id: Optional[str] = None


class QueryAnalysis(BaseModel):
    raw_query: str
    intent: str  # SCHEME_DISCOVERY, FINANCIAL_INFORMATION, DOCUMENT_REQUIREMENTS, etc.
    extracted_entities: Dict[str, Any] = Field(default_factory=dict)
    rewritten_queries: List[str] = Field(default_factory=list)
    filters: RetrievalFilter = Field(default_factory=RetrievalFilter)


class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: str
    scheme_id: Optional[str] = None
    organization: str
    title: str
    page_start: int
    page_end: int
    section: Optional[str] = None
    chunk_type: str
    text: str
    score: float
    rank: int
    source_url: Optional[str] = None
    parent_text: Optional[str] = None
