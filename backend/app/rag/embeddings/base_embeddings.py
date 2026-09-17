from abc import ABC, abstractmethod
from typing import List


class BaseEmbeddingProvider(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Embed a single query text string into a vector."""
        pass

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Batch embed document text strings into vectors."""
        pass

    @abstractmethod
    def dimension(self) -> int:
        """Return vector dimension size (e.g. 384 or 1536)."""
        pass

    @abstractmethod
    def model_name(self) -> str:
        """Return model identifier name."""
        pass

    @abstractmethod
    def version(self) -> str:
        """Return embedding model version string."""
        pass
