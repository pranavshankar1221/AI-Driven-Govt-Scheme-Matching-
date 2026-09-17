from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.document_chunk import DocumentChunk


class ChunkRepository:
    @staticmethod
    def get_by_chunk_id(db: Session, chunk_id: str) -> Optional[DocumentChunk]:
        return db.query(DocumentChunk).filter(DocumentChunk.chunk_id == chunk_id).first()

    @staticmethod
    def get_by_document_id(db: Session, document_id: str) -> List[DocumentChunk]:
        return db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index).all()

    @staticmethod
    def bulk_create(db: Session, chunks_data: List[dict]) -> List[DocumentChunk]:
        chunks = [DocumentChunk(**data) for data in chunks_data]
        db.bulk_save_objects(chunks)
        db.commit()
        return chunks

    @staticmethod
    def delete_by_document(db: Session, document_id: str) -> int:
        count = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        db.commit()
        return count

    @staticmethod
    def delete_by_scheme(db: Session, scheme_id: str) -> int:
        count = db.query(DocumentChunk).filter(DocumentChunk.scheme_id == scheme_id).delete()
        db.commit()
        return count

    @staticmethod
    def get_all_chunks(db: Session) -> List[DocumentChunk]:
        return db.query(DocumentChunk).all()
