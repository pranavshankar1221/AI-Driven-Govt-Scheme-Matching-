from typing import List, Dict, Any
from app.rag.chunkers.base_chunker import BaseChunker, GeneratedChunk
from app.rag.parsers.structure_parser import StructureElement
from app.rag.parsers.table_parser import TableParser
from app.utils.token_counter import count_tokens
from app.utils.hashing import compute_string_hash
from app.core.config import settings


class SemanticChunker(BaseChunker):
    """
    Semantic Chunker that groups paragraphs, lists, and headings into cohesive chunks (400-800 tokens).
    Maintains domain specific content boundaries for Eligibility, Financial, Application, and Documents.
    """

    def create_chunks(
        self,
        elements: List[StructureElement],
        document_id: str,
        scheme_id: str = "",
        organization: str = "",
    ) -> List[GeneratedChunk]:
        chunks: List[GeneratedChunk] = []
        if not elements:
            return chunks

        current_buffer: List[StructureElement] = []
        current_tokens = 0
        chunk_index = 0

        for elem in elements:
            elem_tokens = count_tokens(elem.text)

            # Check if this element is a table block
            if TableParser.is_table_block(elem.text):
                # Flush current buffer first
                if current_buffer:
                    chunk = self._flush_buffer(
                        current_buffer, document_id, scheme_id, organization, chunk_index
                    )
                    if chunk:
                        chunks.append(chunk)
                        chunk_index += 1
                    current_buffer = []
                    current_tokens = 0

                # Process table chunk
                table_text = TableParser.normalize_table(elem.text, heading=" > ".join(elem.heading_path))
                tbl_tokens = count_tokens(table_text)
                tbl_chunk = GeneratedChunk(
                    chunk_id=f"{document_id}_chk_{chunk_index:04d}",
                    document_id=document_id,
                    scheme_id=scheme_id,
                    chunk_index=chunk_index,
                    page_start=elem.page_number,
                    page_end=elem.page_number,
                    section=elem.heading_path[-1] if elem.heading_path else "",
                    heading_path=elem.heading_path,
                    chunk_type="table",
                    text=table_text,
                    token_count=tbl_tokens,
                    content_hash=compute_string_hash(table_text),
                    metadata={"organization": organization, "chunk_type": "table"},
                )
                chunks.append(tbl_chunk)
                chunk_index += 1
                continue

            # Check if adding this element exceeds maximum chunk size
            if current_tokens + elem_tokens > settings.CHUNK_MAX_TOKENS and current_buffer:
                chunk = self._flush_buffer(
                    current_buffer, document_id, scheme_id, organization, chunk_index
                )
                if chunk:
                    chunks.append(chunk)
                    chunk_index += 1

                # Optional overlap: keep last element if semantic continuity is needed
                if current_buffer and current_buffer[-1].element_type in ["eligibility", "financial", "application"]:
                    current_buffer = [current_buffer[-1], elem]
                    current_tokens = count_tokens(current_buffer[0].text) + elem_tokens
                else:
                    current_buffer = [elem]
                    current_tokens = elem_tokens
            else:
                current_buffer.append(elem)
                current_tokens += elem_tokens

                # If target token size reached and boundary is logical, flush
                if current_tokens >= settings.CHUNK_TARGET_TOKENS:
                    chunk = self._flush_buffer(
                        current_buffer, document_id, scheme_id, organization, chunk_index
                    )
                    if chunk:
                        chunks.append(chunk)
                        chunk_index += 1
                    current_buffer = []
                    current_tokens = 0

        # Flush any remaining buffer
        if current_buffer:
            chunk = self._flush_buffer(
                current_buffer, document_id, scheme_id, organization, chunk_index
            )
            if chunk:
                chunks.append(chunk)

        return chunks

    def _flush_buffer(
        self,
        buffer: List[StructureElement],
        document_id: str,
        scheme_id: str,
        organization: str,
        chunk_index: int,
    ) -> GeneratedChunk:
        if not buffer:
            return None

        combined_text = "\n\n".join([e.text for e in buffer])
        token_cnt = count_tokens(combined_text)

        # Allow small chunks only if they contain specialized info (financial, eligibility, documents, lists)
        types_in_buffer = [e.element_type for e in buffer if e.element_type != "heading"]
        primary_type = types_in_buffer[0] if types_in_buffer else "overview"

        if token_cnt < settings.CHUNK_MIN_TOKENS and primary_type not in ["eligibility", "financial", "documents", "application", "table"]:
            # If buffer is too small and generic, keep it unless it's final
            pass

        page_start = min(e.page_number for e in buffer)
        page_end = max(e.page_number for e in buffer)

        heading_path = buffer[0].heading_path if buffer else []
        section_name = heading_path[-1] if heading_path else ""

        chunk_id = f"{document_id}_chk_{chunk_index:04d}"
        content_hash = compute_string_hash(combined_text)

        return GeneratedChunk(
            chunk_id=chunk_id,
            document_id=document_id,
            scheme_id=scheme_id,
            chunk_index=chunk_index,
            page_start=page_start,
            page_end=page_end,
            section=section_name,
            heading_path=heading_path,
            chunk_type=primary_type,
            text=combined_text,
            token_count=token_cnt,
            content_hash=content_hash,
            metadata={
                "organization": organization,
                "chunk_type": primary_type,
                "heading_path": " > ".join(heading_path),
            },
        )
