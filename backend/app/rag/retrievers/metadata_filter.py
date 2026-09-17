from typing import Dict, Any, Optional
from app.schemas.retrieval import RetrievalFilter


class MetadataFilterBuilder:
    """
    Builds clean metadata filter dicts for vector database retrieval.
    Applies hard filters only when intent/entity extraction confidence is high.
    """

    @staticmethod
    def build_filter(retrieval_filter: Optional[RetrievalFilter] = None) -> Optional[Dict[str, Any]]:
        if not retrieval_filter:
            return None

        filters = {}
        if retrieval_filter.scheme_id:
            filters["scheme_id"] = retrieval_filter.scheme_id
        if retrieval_filter.organization:
            filters["organization"] = retrieval_filter.organization
        if retrieval_filter.chunk_type:
            filters["chunk_type"] = retrieval_filter.chunk_type
        if retrieval_filter.language:
            filters["language"] = retrieval_filter.language
        if retrieval_filter.document_id:
            filters["document_id"] = retrieval_filter.document_id

        return filters if filters else None
