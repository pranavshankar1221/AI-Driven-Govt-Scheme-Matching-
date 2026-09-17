from abc import ABC, abstractmethod
from typing import List
from app.schemas.retrieval import RetrievedChunk


class BaseReranker(ABC):
    @abstractmethod
    def rerank(self, query: str, chunks: List[RetrievedChunk], top_k: int = 8) -> List[RetrievedChunk]:
        """Rerank candidates based on exact query-document semantic relevance."""
        pass
