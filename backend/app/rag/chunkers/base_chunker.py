from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel


class GeneratedChunk(BaseModel):
    chunk_id: str
    document_id: str
    scheme_id: str = ""
    parent_chunk_id: str = ""
    chunk_index: int
    page_start: int
    page_end: int
    section: str = ""
    subsection: str = ""
    heading_path: List[str] = []
    chunk_type: str = "semantic"  # eligibility, financial, application, documents, table, list, overview
    text: str
    token_count: int
    content_hash: str
    metadata: Dict[str, Any] = {}


class BaseChunker(ABC):
    @abstractmethod
    def create_chunks(
        self,
        elements: List[Any],
        document_id: str,
        scheme_id: str = "",
        organization: str = "",
    ) -> List[GeneratedChunk]:
        """Create structured chunks from document elements."""
        pass
