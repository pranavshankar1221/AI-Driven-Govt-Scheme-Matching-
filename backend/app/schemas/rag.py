from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class RAGQueryRequest(BaseModel):
    query: str
    scheme_id: Optional[str] = None
    language: str = "en"
    top_k: int = 5
    user_profile: Optional[Dict[str, Any]] = None


class Citation(BaseModel):
    document_id: str
    title: str
    organization: str
    page: int
    page_end: Optional[int] = None
    source_url: Optional[str] = None
    chunk_id: str
    chunk_type: Optional[str] = None
    citation_text: str


class RetrievalDiagnostics(BaseModel):
    dense_count: int
    sparse_count: int
    fused_count: int
    reranked_count: int
    latency_ms: float
    query_intent: str
    rewritten_queries: List[str]


class RAGQueryResponse(BaseModel):
    answer: str
    confidence: str  # high, medium, low
    confidence_score: float
    sources: List[Citation]
    retrieval: RetrievalDiagnostics
    warnings: List[str] = Field(default_factory=list)
