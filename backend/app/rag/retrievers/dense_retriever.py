from typing import List, Dict, Any, Optional
from app.rag.embeddings.base_embeddings import BaseEmbeddingProvider
from app.rag.vectorstores.base_vectorstore import BaseVectorStore, VectorQueryResult
from app.schemas.retrieval import RetrievedChunk


class DenseRetriever:
    """Performs semantic dense vector search."""

    def __init__(self, vector_store: BaseVectorStore, embedding_provider: BaseEmbeddingProvider):
        self.vector_store = vector_store
        self.embedding_provider = embedding_provider

    def retrieve(
        self,
        query: str,
        top_k: int = 20,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedChunk]:
        query_vector = self.embedding_provider.embed_text(query)
        results: List[VectorQueryResult] = self.vector_store.query(
            query_vector=query_vector,
            top_k=top_k,
            filter_metadata=filter_metadata,
        )

        retrieved_chunks = []
        for rank, res in enumerate(results, start=1):
            meta = res.metadata
            doc_id = meta.get("document_id", "")
            chunk_id = meta.get("chunk_id", res.id)

            retrieved_chunks.append(
                RetrievedChunk(
                    chunk_id=chunk_id,
                    document_id=doc_id,
                    scheme_id=meta.get("scheme_id"),
                    organization=meta.get("organization", ""),
                    title=meta.get("title", doc_id),
                    page_start=meta.get("page_start", 1),
                    page_end=meta.get("page_end", 1),
                    section=meta.get("section"),
                    chunk_type=meta.get("chunk_type", "semantic"),
                    text=res.text,
                    score=res.score,
                    rank=rank,
                    source_url=meta.get("source_url"),
                    parent_text=meta.get("parent_text"),
                )
            )

        return retrieved_chunks
