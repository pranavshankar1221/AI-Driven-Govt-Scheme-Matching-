import os
import sys
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, init_db
from app.repositories.document_repository import DocumentRepository
from app.repositories.chunk_repository import ChunkRepository
from app.rag.pipeline.ingest import get_vector_store, IngestionPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reindex_cli")


def main():
    init_db()
    db = SessionLocal()
    pipeline = IngestionPipeline(db)

    documents = DocumentRepository.list_all(db)
    logger.info(f"Re-indexing {len(documents)} existing registered documents...")

    for doc in documents:
        if os.path.exists(doc.file_path):
            logger.info(f"Re-ingesting document: {doc.title} ({doc.file_path})")
            # Clear old chunks
            ChunkRepository.delete_by_document(db, doc.document_id)
            vector_store = get_vector_store()
            vector_store.delete_by_document(doc.document_id)
            DocumentRepository.delete(db, doc.document_id)

            pipeline.process_document(
                file_path=doc.file_path,
                title=doc.title,
                organization=doc.organization,
                scheme_id=doc.scheme_id,
                source_url=doc.source_url,
                document_type=doc.document_type,
                language=doc.language,
                version=doc.version,
            )

    logger.info("Re-indexing completed.")


if __name__ == "__main__":
    main()
