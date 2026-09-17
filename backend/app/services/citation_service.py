from typing import List
from app.schemas.retrieval import RetrievedChunk
from app.schemas.rag import Citation
from app.utils.citations import build_citation_dict


class CitationService:
    """Citation generation and tracking service."""

    @staticmethod
    def generate_citations(chunks: List[RetrievedChunk]) -> List[Citation]:
        citations = []
        seen_chunks = set()

        for chk in chunks:
            if chk.chunk_id in seen_chunks:
                continue
            seen_chunks.add(chk.chunk_id)

            c_dict = build_citation_dict(
                chunk_id=chk.chunk_id,
                document_id=chk.document_id,
                title=chk.title,
                organization=chk.organization,
                page_start=chk.page_start,
                page_end=chk.page_end,
                source_url=chk.source_url,
                chunk_type=chk.chunk_type,
            )

            citations.append(Citation(**c_dict))

        return citations
