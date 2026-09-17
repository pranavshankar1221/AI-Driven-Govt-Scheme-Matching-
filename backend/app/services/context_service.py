import re
import logging
from typing import List
from sqlalchemy.orm import Session
from app.schemas.retrieval import RetrievedChunk
from app.repositories.chunk_repository import ChunkRepository

logger = logging.getLogger(__name__)


class ContextService:
    """
    Service for context expansion and context compression.
    Ensures numerical details (limits, rates, amounts, dates) are never removed.
    """

    @staticmethod
    def expand_parent_context(db: Session, chunks: List[RetrievedChunk]) -> List[RetrievedChunk]:
        """
        If child chunks are retrieved, replace or attach parent chunk text
        when doing so provides richer context without exceeding limits.
        """
        expanded = []
        for chk in chunks:
            # Check if chunk has a parent_chunk_id
            parent_id = getattr(chk, "parent_chunk_id", None)
            if not parent_id:
                expanded.append(chk)
                continue

            parent_chunk = ChunkRepository.get_by_chunk_id(db, parent_id)
            if parent_chunk and parent_chunk.text:
                # Attach parent text to chunk
                chk.parent_text = parent_chunk.text

            expanded.append(chk)

        return expanded

    @staticmethod
    def compress_context(chunks: List[RetrievedChunk], max_tokens: int = 2500) -> List[RetrievedChunk]:
        """
        Compress retrieved context chunks while strictly retaining numbers, eligibility conditions,
        financial rates, and exceptions.
        """
        compressed = []
        seen_sentences = set()

        for chk in chunks:
            text = chk.parent_text if chk.parent_text else chk.text
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

            retained_sentences = []
            for s in sentences:
                s_lower = s.lower()
                s_hash = hash(s_lower)

                if s_hash in seen_sentences:
                    continue
                seen_sentences.add(s_hash)

                # ALWAYS retain lines with numbers, percentages, currency, dates, or eligibility terms
                has_numbers = bool(re.search(r"(\d+|₹|rs|lakh|crore|%|percent|year|month|age|income)", s_lower))
                is_rule = any(kw in s_lower for kw in ["must", "eligible", "should not exceed", "maximum", "minimum", "ceiling", "required", "apply"])

                if has_numbers or is_rule or len(sentences) <= 3:
                    retained_sentences.append(s)

            if retained_sentences:
                chk.text = " ".join(retained_sentences)
                compressed.append(chk)

        return compressed
