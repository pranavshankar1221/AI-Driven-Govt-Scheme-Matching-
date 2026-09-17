from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.document_repository import DocumentRepository
from app.repositories.chunk_repository import ChunkRepository
from app.rag.pipeline.ingest import get_vector_store
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Admin Management"])


@router.delete("/documents/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete document, DB chunks, and vector index records."""
    vector_store = get_vector_store()
    vector_store.delete_by_document(document_id)

    chunks_deleted = ChunkRepository.delete_by_document(db, document_id)
    doc_deleted = DocumentRepository.delete(db, document_id)

    if not doc_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return {
        "status": "success",
        "document_id": document_id,
        "chunks_deleted": chunks_deleted,
    }


@router.get("/vectorstore/health")
def vectorstore_health():
    """Check health and record count of active vector store."""
    vector_store = get_vector_store()
    return vector_store.health_check()
