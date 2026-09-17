import os
import json
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from app.rag.vectorstores.base_vectorstore import BaseVectorStore, VectorRecord, VectorQueryResult
from app.core.config import settings

logger = logging.getLogger(__name__)


class LocalVectorStore(BaseVectorStore):
    """
    Local Vector Store implementation.
    Stores records in memory and persists to local JSON disk cache.
    Calculates exact cosine similarity with full metadata filtering.
    """

    def __init__(self, storage_path: str = None):
        if storage_path is None:
            storage_path = os.path.join(settings.CACHE_DIR, "local_vectorstore.json")
        self.storage_path = storage_path
        self.records: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    self.records = json.load(f)
                logger.info(f"Loaded {len(self.records)} vector records from {self.storage_path}")
            except Exception as e:
                logger.error(f"Failed to load local vectorstore cache: {e}")
                self.records = {}
        else:
            self.records = {}

    def _save(self):
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(self.records, f)
        except Exception as e:
            logger.error(f"Failed to save local vectorstore cache: {e}")

    def upsert(self, records: List[VectorRecord]) -> bool:
        for r in records:
            self.records[r.id] = {
                "id": r.id,
                "vector": r.vector,
                "metadata": r.metadata,
                "text": r.text,
            }
        self._save()
        return True

    def delete(self, ids: List[str]) -> bool:
        deleted = False
        for vid in ids:
            if vid in self.records:
                del self.records[vid]
                deleted = True
        if deleted:
            self._save()
        return True

    def query(
        self,
        query_vector: List[float],
        top_k: int = 20,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[VectorQueryResult]:
        if not self.records or not query_vector:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        results = []

        for vid, rec in self.records.items():
            meta = rec.get("metadata", {})

            # Apply metadata filters
            if filter_metadata:
                match = True
                for k, v in filter_metadata.items():
                    if meta.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            d_vec = np.array(rec["vector"], dtype=np.float32)
            d_norm = np.linalg.norm(d_vec)
            if d_norm == 0:
                score = 0.0
            else:
                score = float(np.dot(q_vec, d_vec) / (q_norm * d_norm))

            results.append(
                VectorQueryResult(
                    id=vid,
                    score=score,
                    metadata=meta,
                    text=rec.get("text", ""),
                )
            )

        # Sort by similarity score descending
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def fetch(self, ids: List[str]) -> List[VectorRecord]:
        found = []
        for vid in ids:
            if vid in self.records:
                r = self.records[vid]
                found.append(
                    VectorRecord(
                        id=r["id"],
                        vector=r["vector"],
                        metadata=r["metadata"],
                        text=r.get("text", ""),
                    )
                )
        return found

    def delete_by_document(self, document_id: str) -> bool:
        to_del = [vid for vid, r in self.records.items() if r.get("metadata", {}).get("document_id") == document_id]
        return self.delete(to_del)

    def delete_by_scheme(self, scheme_id: str) -> bool:
        to_del = [vid for vid, r in self.records.items() if r.get("metadata", {}).get("scheme_id") == scheme_id]
        return self.delete(to_del)

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "local",
            "record_count": len(self.records),
            "storage_path": self.storage_path,
        }
