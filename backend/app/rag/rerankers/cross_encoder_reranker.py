import logging
import re
from typing import List
from app.rag.rerankers.base_reranker import BaseReranker
from app.schemas.retrieval import RetrievedChunk
from app.core.config import settings

logger = logging.getLogger(__name__)

_cross_encoder_instance = None


class CrossEncoderReranker(BaseReranker):
    """
    Cross-Encoder Reranker evaluating true Query <-> Chunk semantic relevance.
    Uses sentence-transformers `CrossEncoder` with term overlap fallback.
    """

    def __init__(self):
        self.model_name = settings.RERANKER_MODEL

    def _get_model(self):
        global _cross_encoder_instance
        if _cross_encoder_instance is not None:
            return _cross_encoder_instance

        try:
            from sentence_transformers import CrossEncoder
            _cross_encoder_instance = CrossEncoder(self.model_name)
            logger.info(f"Loaded CrossEncoder model: {self.model_name}")
            return _cross_encoder_instance
        except Exception as e:
            logger.warning(f"Could not load CrossEncoder model '{self.model_name}': {e}. Using lexical term overlap reranking fallback.")
            return None

    def rerank(self, query: str, chunks: List[RetrievedChunk], top_k: int = 8) -> List[RetrievedChunk]:
        if not chunks:
            return []

        model = self._get_model()
        if model is not None:
            try:
                pairs = [(query, chk.text) for chk in chunks]
                scores = model.predict(pairs)
                for idx, score in enumerate(scores):
                    chunks[idx].score = float(score)

                chunks.sort(key=lambda x: x.score, reverse=True)
                for rank, chk in enumerate(chunks, start=1):
                    chk.rank = rank

                return chunks[:top_k]
            except Exception as e:
                logger.error(f"CrossEncoder prediction failed: {e}")

        # Term overlap fallback scoring
        query_words = set(re.findall(r"\w+", query.lower()))
        for chk in chunks:
            chk_words = set(re.findall(r"\w+", chk.text.lower()))
            overlap = len(query_words.intersection(chk_words))
            # Boost specialized chunk types
            boost = 1.2 if chk.chunk_type in ["eligibility", "financial", "documents", "application", "table"] else 1.0
            chk.score = float(overlap * boost)

        chunks.sort(key=lambda x: x.score, reverse=True)
        for rank, chk in enumerate(chunks, start=1):
            chk.rank = rank

        return chunks[:top_k]
