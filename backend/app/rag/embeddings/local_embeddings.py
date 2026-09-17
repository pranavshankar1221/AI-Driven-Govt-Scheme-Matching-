import logging
import hashlib
import numpy as np
from typing import List
from app.rag.embeddings.base_embeddings import BaseEmbeddingProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

_model_instance = None


class LocalEmbeddingProvider(BaseEmbeddingProvider):
    """
    Local embedding provider utilizing Sentence-Transformers (`all-MiniLM-L6-v2`)
    with robust hash-based fallback for completely offline execution.
    """

    def __init__(self):
        self._dimension = settings.EMBEDDING_DIMENSION
        self._model_name = settings.EMBEDDING_MODEL
        self._version = settings.EMBEDDING_VERSION

    def _get_st_model(self):
        global _model_instance
        if _model_instance is not None:
            return _model_instance

        try:
            from sentence_transformers import SentenceTransformer
            _model_instance = SentenceTransformer(self._model_name)
            logger.info(f"Loaded sentence-transformers model: {self._model_name}")
            return _model_instance
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer '{self._model_name}': {e}. Using deterministic local embedding fallback.")
            return None

    def embed_text(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self._dimension

        st_model = self._get_st_model()
        if st_model is not None:
            try:
                vec = st_model.encode(text, convert_to_numpy=True)
                return vec.tolist()
            except Exception as e:
                logger.error(f"Error during SentenceTransformer encoding: {e}")

        # Deterministic feature vector fallback
        return self._hash_vector(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        st_model = self._get_st_model()
        if st_model is not None:
            try:
                vecs = st_model.encode(texts, batch_size=32, convert_to_numpy=True)
                return vecs.tolist()
            except Exception as e:
                logger.error(f"Error during batch encoding: {e}")

        return [self._hash_vector(t) for t in texts]

    def _hash_vector(self, text: str) -> List[float]:
        """Generate a unit-normalized deterministic feature vector for offline dev fallback."""
        vec = np.zeros(self._dimension, dtype=np.float32)
        words = text.lower().split()
        for idx, word in enumerate(words):
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            pos = h % self._dimension
            sign = 1.0 if (h % 2 == 0) else -1.0
            vec[pos] += sign / (1.0 + idx * 0.1)

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def dimension(self) -> int:
        return self._dimension

    def model_name(self) -> str:
        return self._model_name

    def version(self) -> str:
        return self._version
