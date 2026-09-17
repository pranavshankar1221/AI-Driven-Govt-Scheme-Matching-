from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.document import Document
from app.schemas.document import DocumentCreate


class DocumentRepository:
    @staticmethod
    def get_by_document_id(db: Session, document_id: str) -> Optional[Document]:
        return db.query(Document).filter(Document.document_id == document_id).first()

    @staticmethod
    def get_by_hash(db: Session, file_hash: str) -> Optional[Document]:
        return db.query(Document).filter(Document.file_hash == file_hash).first()

    @staticmethod
    def list_all(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
        return db.query(Document).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, doc_data: dict) -> Document:
        doc = Document(**doc_data)
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def update_status(db: Session, document_id: str, status: str, page_count: Optional[int] = None) -> Optional[Document]:
        doc = DocumentRepository.get_by_document_id(db, document_id)
        if doc:
            doc.status = status
            if page_count is not None:
                doc.page_count = page_count
            db.commit()
            db.refresh(doc)
        return doc

    @staticmethod
    def delete(db: Session, document_id: str) -> bool:
        doc = DocumentRepository.get_by_document_id(db, document_id)
        if doc:
            db.delete(doc)
            db.commit()
            return True
        return False
