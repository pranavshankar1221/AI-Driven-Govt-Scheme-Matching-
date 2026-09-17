import os
import uuid
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.rag.loaders.pdf_loader import PDFLoader
from app.rag.loaders.text_loader import TextLoader
from app.rag.parsers.pdf_parser import PDFParser
from app.rag.chunkers.hierarchical_chunker import HierarchicalChunker
from app.rag.embeddings.local_embeddings import LocalEmbeddingProvider
from app.rag.vectorstores.local_vectorstore import LocalVectorStore
from app.rag.vectorstores.pinecone_vectorstore import PineconeVectorStore
from app.rag.vectorstores.base_vectorstore import VectorRecord
from app.repositories.document_repository import DocumentRepository
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.ingestion_repository import IngestionRepository
from app.utils.hashing import compute_file_hash
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_vector_store():
    """Factory function returning active VectorStore based on configuration."""
    if settings.VECTOR_STORE == "pinecone":
        return PineconeVectorStore()
    return LocalVectorStore()


class IngestionPipeline:
    """
    End-to-end Idempotent Document Ingestion Pipeline.
    Steps:
    1. Calculate SHA-256 hash.
    2. Check whether document already exists (skip if unchanged).
    3. Extract text & preserve page boundaries.
    4. Detect headings, tables, lists, structure.
    5. Hierarchical / Semantic chunking.
    6. Chunk Metadata Enrichment.
    7. Embedding Generation.
    8. Vector Store Upsert.
    9. Database Storage.
    """

    def __init__(self, db: Session):
        self.db = db
        self.pdf_loader = PDFLoader()
        self.text_loader = TextLoader()
        self.pdf_parser = PDFParser()
        self.chunker = HierarchicalChunker()
        self.embedding_provider = LocalEmbeddingProvider()
        self.vector_store = get_vector_store()

    def process_document(
        self,
        file_path: str,
        title: str,
        organization: str,
        scheme_id: str = "",
        source_url: str = "",
        document_type: str = "guideline",
        language: str = "en",
        version: str = "1.0",
        effective_date: str = "",
    ) -> Dict[str, Any]:
        file_hash = compute_file_hash(file_path)
        existing_doc = DocumentRepository.get_by_hash(self.db, file_hash)

        # Idempotency check: skip unchanged documents
        if existing_doc and existing_doc.status == "active":
            logger.info(f"Document {file_path} with hash {file_hash} already ingested. Skipping.")
            return {
                "document_id": existing_doc.document_id,
                "status": "skipped",
                "message": "Document already ingested and unchanged",
                "chunks_created": 0,
            }

        document_id = f"{organization.lower()}_{uuid.uuid4().hex[:8]}"
        job_id = f"job_{uuid.uuid4().hex[:8]}"
        IngestionRepository.create_job(self.db, job_id, document_id)

        try:
            # 1. Load document
            ext = os.path.splitext(file_path)[1].lower()
            if ext == ".pdf":
                pages = self.pdf_loader.load(file_path)
            else:
                pages = self.text_loader.load(file_path)

            page_count = len(pages)

            # 2. Parse structural elements
            elements = self.pdf_parser.parse_pages(pages)

            # 3. Create Hierarchical Chunks
            chunks = self.chunker.create_chunks(
                elements=elements,
                document_id=document_id,
                scheme_id=scheme_id,
                organization=organization,
            )

            if not chunks:
                raise ValueError("No chunks extracted from document.")

            # 4. Generate Embeddings & Prepare Vector Records
            texts = [c.text for c in chunks]
            vectors = self.embedding_provider.embed_documents(texts)

            vector_records = []
            db_chunks_payload = []

            for idx, c in enumerate(chunks):
                vec = vectors[idx]
                meta_json = {
                    "document_id": document_id,
                    "chunk_id": c.chunk_id,
                    "scheme_id": scheme_id,
                    "organization": organization,
                    "title": title,
                    "document_type": document_type,
                    "language": language,
                    "page_start": c.page_start,
                    "page_end": c.page_end,
                    "section": c.section,
                    "heading_path": " > ".join(c.heading_path),
                    "chunk_type": c.chunk_type,
                    "effective_date": effective_date,
                    "version": version,
                    "source_url": source_url,
                    "content_hash": c.content_hash,
                }

                rec_id = f"{document_id}:{c.chunk_id}"
                vector_records.append(
                    VectorRecord(
                        id=rec_id,
                        vector=vec,
                        metadata=meta_json,
                        text=c.text,
                    )
                )

                db_chunks_payload.append({
                    "chunk_id": c.chunk_id,
                    "document_id": document_id,
                    "scheme_id": scheme_id,
                    "parent_chunk_id": c.parent_chunk_id,
                    "chunk_index": c.chunk_index,
                    "page_start": c.page_start,
                    "page_end": c.page_end,
                    "section": c.section,
                    "subsection": c.subsection,
                    "heading_path": " > ".join(c.heading_path),
                    "chunk_type": c.chunk_type,
                    "text": c.text,
                    "token_count": c.token_count,
                    "content_hash": c.content_hash,
                    "embedding_model": self.embedding_provider.model_name(),
                    "embedding_version": self.embedding_provider.version(),
                    "metadata_json": str(meta_json),
                })

            # 5. Upsert into Vector Store
            self.vector_store.upsert(vector_records)

            # 6. Save in Relational Database
            doc_record = {
                "document_id": document_id,
                "title": title,
                "source_url": source_url,
                "organization": organization,
                "scheme_id": scheme_id,
                "document_type": document_type,
                "language": language,
                "version": version,
                "effective_date": effective_date,
                "file_path": file_path,
                "file_hash": file_hash,
                "page_count": page_count,
                "status": "active",
            }
            DocumentRepository.create(self.db, doc_record)
            ChunkRepository.bulk_create(self.db, db_chunks_payload)

            IngestionRepository.update_job(self.db, job_id, "completed", total_chunks=len(chunks))

            return {
                "document_id": document_id,
                "job_id": job_id,
                "status": "completed",
                "chunks_created": len(chunks),
                "page_count": page_count,
            }

        except Exception as e:
            logger.error(f"Ingestion failed for {file_path}: {e}", exc_info=True)
            IngestionRepository.update_job(self.db, job_id, "failed", error_message=str(e))
            raise e
