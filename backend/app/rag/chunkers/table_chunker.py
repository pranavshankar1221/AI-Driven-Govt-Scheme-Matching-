from typing import List, Dict, Any
from app.rag.chunkers.base_chunker import BaseChunker, GeneratedChunk
from app.rag.parsers.table_parser import TableParser
from app.utils.token_counter import count_tokens
from app.utils.hashing import compute_string_hash


class TableChunker:
    """Specialized chunker for tabular and financial rate structures."""

    @staticmethod
    def process_table_segment(
        table_text: str,
        document_id: str,
        scheme_id: str,
        page_number: int,
        heading_path: List[str],
        chunk_index: int,
    ) -> GeneratedChunk:
        normalized_text = TableParser.normalize_table(
            table_text, heading=" > ".join(heading_path)
        )
        token_cnt = count_tokens(normalized_text)
        content_hash = compute_string_hash(normalized_text)
        chunk_id = f"{document_id}_tbl_{chunk_index}"

        section_name = heading_path[-1] if heading_path else "Financial Table"

        return GeneratedChunk(
            chunk_id=chunk_id,
            document_id=document_id,
            scheme_id=scheme_id,
            chunk_index=chunk_index,
            page_start=page_number,
            page_end=page_number,
            section=section_name,
            heading_path=heading_path,
            chunk_type="table",
            text=normalized_text,
            token_count=token_cnt,
            content_hash=content_hash,
            metadata={"is_table": True, "raw_table": table_text},
        )
