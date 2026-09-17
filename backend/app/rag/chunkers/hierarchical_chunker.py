from typing import List, Tuple, Dict, Any
from app.rag.chunkers.base_chunker import BaseChunker, GeneratedChunk
from app.rag.chunkers.semantic_chunker import SemanticChunker
from app.rag.parsers.structure_parser import StructureElement
from app.utils.token_counter import count_tokens
from app.utils.hashing import compute_string_hash


class HierarchicalChunker(BaseChunker):
    """
    Hierarchical Parent-Child Chunker.
    Generates Parent Chunks (800-1500 tokens) and Child Chunks (300-600 tokens).
    Retrieved Child Chunks can expand to their Parent Chunk context during generation.
    """

    def __init__(self):
        self.semantic_chunker = SemanticChunker()

    def create_chunks(
        self,
        elements: List[StructureElement],
        document_id: str,
        scheme_id: str = "",
        organization: str = "",
    ) -> List[GeneratedChunk]:
        """Returns combined list of parent and child chunks."""
        parents, children = self.create_hierarchical_chunks(
            elements, document_id, scheme_id, organization
        )
        return parents + children

    def create_hierarchical_chunks(
        self,
        elements: List[StructureElement],
        document_id: str,
        scheme_id: str = "",
        organization: str = "",
    ) -> Tuple[List[GeneratedChunk], List[GeneratedChunk]]:
        parent_chunks: List[GeneratedChunk] = []
        child_chunks: List[GeneratedChunk] = []

        if not elements:
            return parent_chunks, child_chunks

        # Group elements by major heading sections or large token blocks (800-1500 tokens)
        sections: List[List[StructureElement]] = []
        current_section: List[StructureElement] = []
        current_tokens = 0

        for elem in elements:
            token_cnt = count_tokens(elem.text)
            if current_tokens + token_cnt > 1400 and current_section:
                sections.append(current_section)
                current_section = [elem]
                current_tokens = token_cnt
            else:
                current_section.append(elem)
                current_tokens += token_cnt

        if current_section:
            sections.append(current_section)

        parent_idx = 0
        child_idx = 0

        for section_elements in sections:
            # Build Parent Chunk
            parent_text = "\n\n".join([e.text for e in section_elements])
            parent_tokens = count_tokens(parent_text)
            parent_id = f"{document_id}_parent_{parent_idx:03d}"
            page_start = min(e.page_number for e in section_elements)
            page_end = max(e.page_number for e in section_elements)
            heading_path = section_elements[0].heading_path if section_elements else []

            parent_chunk = GeneratedChunk(
                chunk_id=parent_id,
                document_id=document_id,
                scheme_id=scheme_id,
                parent_chunk_id="",
                chunk_index=parent_idx,
                page_start=page_start,
                page_end=page_end,
                section=heading_path[-1] if heading_path else "Parent Section",
                heading_path=heading_path,
                chunk_type="parent_section",
                text=parent_text,
                token_count=parent_tokens,
                content_hash=compute_string_hash(parent_text),
                metadata={"is_parent": True, "organization": organization},
            )
            parent_chunks.append(parent_chunk)

            # Generate Child Chunks for this section
            children = self.semantic_chunker.create_chunks(
                section_elements, document_id, scheme_id, organization
            )

            for child in children:
                child.parent_chunk_id = parent_id
                child.chunk_id = f"{document_id}_child_{child_idx:04d}"
                child.chunk_index = child_idx
                child.metadata["parent_chunk_id"] = parent_id
                child_chunks.append(child)
                child_idx += 1

            parent_idx += 1

        return parent_chunks, child_chunks
