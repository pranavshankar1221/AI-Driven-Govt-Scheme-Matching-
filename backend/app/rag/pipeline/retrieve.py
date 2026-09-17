from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.rag.embeddings.local_embeddings import LocalEmbeddingProvider
from app.rag.vectorstores.local_vectorstore import LocalVectorStore
from app.rag.vectorstores.pinecone_vectorstore import PineconeVectorStore
from app.rag.retrievers.dense_retriever import DenseRetriever
from app.rag.retrievers.sparse_retriever import SparseRetriever
from app.rag.retrievers.hybrid_retriever import HybridRetriever
from app.rag.rerankers.cross_encoder_reranker import CrossEncoderReranker
from app.schemas.retrieval import RetrievedChunk
from app.repositories.chunk_repository import ChunkRepository
from app.core.config import settings


class RetrievalPipeline:
    """
    End-to-end Retrieval Pipeline.
    Dense Retrieval + BM25 Sparse Retrieval -> RRF Fusion -> Cross-Encoder Reranking.
    """

    def __init__(self, db: Session):
        self.db = db
        self.embedding_provider = LocalEmbeddingProvider()
        
        if settings.VECTOR_STORE == "pinecone":
            self.vector_store = PineconeVectorStore()
        else:
            self.vector_store = LocalVectorStore()

        self.dense_retriever = DenseRetriever(self.vector_store, self.embedding_provider)
        self.sparse_retriever = SparseRetriever()
        self.hybrid_retriever = HybridRetriever(self.dense_retriever, self.sparse_retriever)
        self.reranker = CrossEncoderReranker()

        # Warm up BM25 sparse index from DB chunks
        self._warmup_sparse_index()

    def _warmup_sparse_index(self):
        try:
            chunks = ChunkRepository.get_all_chunks(self.db)
            if chunks:
                self.sparse_retriever.index_chunks(chunks)
        except Exception:
            pass

    def retrieve_candidates(
        self,
        query: str,
        dense_top_k: int = settings.RAG_DENSE_TOP_K,
        sparse_top_k: int = settings.RAG_SPARSE_TOP_K,
        rerank_top_k: int = settings.RAG_RERANK_TOP_K,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # 1. Hybrid Retrieval (Dense + Sparse + RRF)
        fused_chunks = self.hybrid_retriever.retrieve(
            query=query,
            dense_top_k=dense_top_k,
            sparse_top_k=sparse_top_k,
            filter_metadata=filter_metadata,
        )

        # 2. Cross-Encoder Reranking
        if settings.ENABLE_RERANKING and fused_chunks:
            reranked_chunks = self.reranker.rerank(
                query=query, chunks=fused_chunks, top_k=rerank_top_k
            )
        else:
            reranked_chunks = fused_chunks[:rerank_top_k]

        return {
            "dense_count": len(fused_chunks),
            "sparse_count": len(fused_chunks),
            "fused_count": len(fused_chunks),
            "reranked_chunks": reranked_chunks,
        }
