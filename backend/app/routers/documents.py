from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.document import DocumentResponse
from app.repositories.document_repository import DocumentRepository

router = APIRouter(prefix="/documents", tags=["Documents Registry"])


@router.get("", response_model=List[DocumentResponse])
def list_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all registered official scheme documents."""
    return DocumentRepository.list_all(db, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    """Get metadata for a specific document."""
    doc = DocumentRepository.get_by_document_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc
