import logging
from typing import List, Dict, Any, Optional
from app.rag.vectorstores.base_vectorstore import BaseVectorStore, VectorRecord, VectorQueryResult
from app.core.config import settings

logger = logging.getLogger(__name__)


class PineconeVectorStore(BaseVectorStore):
    """
    Production Pinecone VectorStore implementation.
    Operates using Pinecone API with namespaces and metadata filtering.
    """

    def __init__(self):
        self.api_key = settings.PINECONE_API_KEY
        self.index_name = settings.PINECONE_INDEX
        self.namespace = settings.PINECONE_NAMESPACE
        self.client = None
        self.index = None

        if self.api_key:
            try:
                from pinecone import Pinecone
                self.client = Pinecone(api_key=self.api_key)
                self.index = self.client.Index(self.index_name)
                logger.info(f"Initialized Pinecone client for index '{self.index_name}' [namespace: {self.namespace}]")
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone client: {e}")

    def upsert(self, records: List[VectorRecord]) -> bool:
        if not self.index:
            raise RuntimeError("Pinecone index is not initialized. Check PINECONE_API_KEY.")

        vectors_payload = []
        for r in records:
            # Vector ID format: document_id:chunk_id
            payload_meta = dict(r.metadata)
            payload_meta["text"] = r.text
            vectors_payload.append({
                "id": r.id,
                "values": r.vector,
                "metadata": payload_meta,
            })

        # Batch upsert
        batch_size = 100
        for i in range(0, len(vectors_payload), batch_size):
            batch = vectors_payload[i:i + batch_size]
            self.index.upsert(vectors=batch, namespace=self.namespace)

        return True

    def delete(self, ids: List[str]) -> bool:
        if not self.index or not ids:
            return False
        self.index.delete(ids=ids, namespace=self.namespace)
        return True

    def query(
        self,
        query_vector: List[float],
        top_k: int = 20,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[VectorQueryResult]:
        if not self.index:
            raise RuntimeError("Pinecone index is not initialized.")

        query_kwargs = {
            "vector": query_vector,
            "top_k": top_k,
            "namespace": self.namespace,
            "include_metadata": True,
        }

        if filter_metadata:
            query_kwargs["filter"] = filter_metadata

        res = self.index.query(**query_kwargs)
        results = []
        for match in res.get("matches", []):
            meta = match.get("metadata", {})
            text = meta.pop("text", "")
            results.append(
                VectorQueryResult(
                    id=match["id"],
                    score=match["score"],
                    metadata=meta,
                    text=text,
                )
            )

        return results

    def fetch(self, ids: List[str]) -> List[VectorRecord]:
        if not self.index or not ids:
            return []
        res = self.index.fetch(ids=ids, namespace=self.namespace)
        found = []
        for vid, item in res.get("vectors", {}).items():
            meta = item.get("metadata", {})
            text = meta.pop("text", "")
            found.append(
                VectorRecord(
                    id=vid,
                    vector=item.get("values", []),
                    metadata=meta,
                    text=text,
                )
            )
        return found

    def delete_by_document(self, document_id: str) -> bool:
        if not self.index:
            return False
        self.index.delete(filter={"document_id": document_id}, namespace=self.namespace)
        return True

    def delete_by_scheme(self, scheme_id: str) -> bool:
        if not self.index:
            return False
        self.index.delete(filter={"scheme_id": scheme_id}, namespace=self.namespace)
        return True

    def health_check(self) -> Dict[str, Any]:
        if not self.index:
            return {"status": "unhealthy", "provider": "pinecone", "error": "Not connected"}
        try:
            stats = self.index.describe_index_stats()
            return {
                "status": "healthy",
                "provider": "pinecone",
                "index_name": self.index_name,
                "namespace": self.namespace,
                "stats": stats,
            }
        except Exception as e:
            return {"status": "unhealthy", "provider": "pinecone", "error": str(e)}
