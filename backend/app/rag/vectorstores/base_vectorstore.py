from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class VectorRecord(BaseModel):
    id: str  # document_id + ":" + chunk_id
    vector: List[float]
    metadata: Dict[str, Any]
    text: str = ""


class VectorQueryResult(BaseModel):
    id: str
    score: float
    metadata: Dict[str, Any]
    text: str = ""


class BaseVectorStore(ABC):
    @abstractmethod
    def upsert(self, records: List[VectorRecord]) -> bool:
        """Upsert vectors into storage."""
        pass

    @abstractmethod
    def delete(self, ids: List[str]) -> bool:
        """Delete vectors by record IDs."""
        pass

    @abstractmethod
    def query(
        self,
        query_vector: List[float],
        top_k: int = 20,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[VectorQueryResult]:
        """Perform similarity query with metadata filtering."""
        pass

    @abstractmethod
    def fetch(self, ids: List[str]) -> List[VectorRecord]:
        """Fetch records by ID."""
        pass

    @abstractmethod
    def delete_by_document(self, document_id: str) -> bool:
        """Delete all vectors matching document_id."""
        pass

    @abstractmethod
    def delete_by_scheme(self, scheme_id: str) -> bool:
        """Delete all vectors matching scheme_id."""
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Check vector store status and connectivity."""
        pass
