import re
import math
import logging
from typing import List, Dict, Any, Optional
from app.schemas.retrieval import RetrievedChunk

logger = logging.getLogger(__name__)


class PurePythonBM25:
    """Pure Python BM25 implementation for offline / zero-dependency execution."""

    def __init__(self, corpus: List[List[str]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.avgdl = sum(len(doc) for doc in corpus) / self.corpus_size if self.corpus_size > 0 else 0
        self.doc_freqs = []
        self.idf = {}
        self.doc_len = []

        for doc in corpus:
            self.doc_len.append(len(doc))
            frequencies = {}
            for word in doc:
                frequencies[word] = frequencies.get(word, 0) + 1
            self.doc_freqs.append(frequencies)

            for word in frequencies:
                self.idf[word] = self.idf.get(word, 0) + 1

        for word, freq in self.idf.items():
            self.idf[word] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1)

    def get_scores(self, query: List[str]) -> List[float]:
        scores = [0.0] * self.corpus_size
        for q in query:
            if q not in self.idf:
                continue
            idf_score = self.idf[q]
            for idx, doc_freq in enumerate(self.doc_freqs):
                freq = doc_freq.get(q, 0)
                if freq > 0:
                    num = freq * (self.k1 + 1)
                    denom = freq + self.k1 * (1 - self.b + self.b * (self.doc_len[idx] / self.avgdl))
                    scores[idx] += idf_score * (num / denom)
        return scores


class SparseRetriever:
    """
    BM25 Lexical Keyword Retriever.
    Indexes active chunks and computes exact BM25 keyword matching scores.
    Uses rank_bm25 if available or PurePythonBM25 fallback.
    """

    def __init__(self):
        self.bm25 = None
        self.chunks_cache: List[Dict[str, Any]] = []

    def index_chunks(self, chunks: List[Any]):
        """Index a list of DocumentChunk OR ORM objects for BM25 search."""
        self.chunks_cache = []
        corpus_tokens = []

        for chk in chunks:
            text = getattr(chk, "text", "")
            meta = getattr(chk, "metadata_json", {})
            if isinstance(meta, str):
                import json
                try:
                    meta = json.loads(meta)
                except Exception:
                    meta = {}

            item = {
                "chunk_id": getattr(chk, "chunk_id", ""),
                "document_id": getattr(chk, "document_id", ""),
                "scheme_id": getattr(chk, "scheme_id", None),
                "organization": meta.get("organization", getattr(chk, "organization", "")),
                "title": meta.get("title", getattr(chk, "document_id", "")),
                "page_start": getattr(chk, "page_start", 1),
                "page_end": getattr(chk, "page_end", 1),
                "section": getattr(chk, "section", None),
                "chunk_type": getattr(chk, "chunk_type", "semantic"),
                "text": text,
                "source_url": meta.get("source_url"),
            }
            self.chunks_cache.append(item)

            tokens = self._tokenize(text)
            corpus_tokens.append(tokens)

        if corpus_tokens:
            try:
                from rank_bm25 import BM25Okapi
                self.bm25 = BM25Okapi(corpus_tokens)
            except Exception:
                logger.info("rank_bm25 package not found. Using PurePythonBM25 implementation.")
                self.bm25 = PurePythonBM25(corpus_tokens)

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 1]

    def retrieve(
        self,
        query: str,
        top_k: int = 20,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedChunk]:
        if not self.bm25 or not self.chunks_cache:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scores = self.bm25.get_scores(query_tokens)

        scored_candidates = []
        for idx, score in enumerate(scores):
            if score <= 0:
                continue

            item = self.chunks_cache[idx]

            # Apply metadata filters if provided
            if filter_metadata:
                match = True
                for k, v in filter_metadata.items():
                    if item.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            scored_candidates.append((score, item))

        # Sort descending
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        results = []
        for rank, (score, item) in enumerate(scored_candidates[:top_k], start=1):
            results.append(
                RetrievedChunk(
                    chunk_id=item["chunk_id"],
                    document_id=item["document_id"],
                    scheme_id=item["scheme_id"],
                    organization=item.get("organization", ""),
                    title=item.get("title", item["document_id"]),
                    page_start=item["page_start"],
                    page_end=item["page_end"],
                    section=item["section"],
                    chunk_type=item["chunk_type"],
                    text=item["text"],
                    score=float(score),
                    rank=rank,
                    source_url=item.get("source_url"),
                )
            )

        return results
