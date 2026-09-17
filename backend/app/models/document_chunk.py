import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(String(150), unique=True, index=True, nullable=False)
    document_id = Column(String(100), nullable=False, index=True)
    scheme_id = Column(String(100), nullable=True, index=True)
    parent_chunk_id = Column(String(150), nullable=True, index=True)
    chunk_index = Column(Integer, nullable=False)
    page_start = Column(Integer, nullable=False)
    page_end = Column(Integer, nullable=False)
    section = Column(String(255), nullable=True)
    subsection = Column(String(255), nullable=True)
    heading_path = Column(Text, nullable=True)  # JSON-encoded array or pipe-separated string
    chunk_type = Column(String(50), default="semantic")  # eligibility, financial, application, documents, table, list, faq
    text = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)
    embedding_model = Column(String(100), nullable=False)
    embedding_version = Column(String(50), nullable=False)
    metadata_json = Column(Text, nullable=True)  # JSON-encoded dictionary metadata
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
