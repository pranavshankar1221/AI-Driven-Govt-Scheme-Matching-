import logging
from typing import List, Dict, Any, Optional
from app.rag.retrievers.dense_retriever import DenseRetriever
from app.rag.retrievers.sparse_retriever import SparseRetriever
from app.schemas.retrieval import RetrievedChunk
from app.utils.hashing import compute_string_hash

logger = logging.getLogger(__name__)


class HybridRetriever:
    """
    Hybrid Retriever combining Dense Semantic Search and Sparse BM25 Search.
    Uses Reciprocal Rank Fusion (RRF) formula:
      RRF_score(d) = sum( 1 / (k + rank_i(d)) ) with default k = 60.
    Handles exact/near deduplication by content hash.
    """

    def __init__(self, dense_retriever: DenseRetriever, sparse_retriever: SparseRetriever, rrf_k: int = 60):
        self.dense_retriever = dense_retriever
        self.sparse_retriever = sparse_retriever
        self.rrf_k = rrf_k

    def retrieve(
        self,
        query: str,
        dense_top_k: int = 20,
        sparse_top_k: int = 20,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedChunk]:
        # 1. Fetch dense candidates
        dense_chunks = self.dense_retriever.retrieve(
            query=query, top_k=dense_top_k, filter_metadata=filter_metadata
        )

        # 2. Fetch sparse candidates
        sparse_chunks = self.sparse_retriever.retrieve(
            query=query, top_k=sparse_top_k, filter_metadata=filter_metadata
        )

        # 3. Apply Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, RetrievedChunk] = {}
        seen_hashes: Dict[str, str] = {}  # content_hash -> chunk_id

        def add_to_fusion(chunk_list: List[RetrievedChunk]):
            for rank, chk in enumerate(chunk_list, start=1):
                h = compute_string_hash(chk.text)
                # Deduplication check
                if h in seen_hashes and seen_hashes[h] != chk.chunk_id:
                    target_id = seen_hashes[h]
                else:
                    target_id = chk.chunk_id
                    seen_hashes[h] = target_id
                    chunk_map[target_id] = chk

                rank_score = 1.0 / (self.rrf_k + rank)
                rrf_scores[target_id] = rrf_scores.get(target_id, 0.0) + rank_score

        add_to_fusion(dense_chunks)
        add_to_fusion(sparse_chunks)

        # Sort combined results by RRF score descending
        fused_candidates = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

        fused_chunks = []
        for rank, (cid, score) in enumerate(fused_candidates, start=1):
            chunk_obj = chunk_map[cid]
            chunk_obj.score = float(score)
            chunk_obj.rank = rank
            fused_chunks.append(chunk_obj)

        logger.info(f"Hybrid retrieval fused {len(dense_chunks)} dense + {len(sparse_chunks)} sparse -> {len(fused_chunks)} unique candidates")
        return fused_chunks
