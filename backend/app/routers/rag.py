from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/rag", tags=["RAG Pipeline"])


@router.post("/query", response_model=RAGQueryResponse)
def query_rag(request: RAGQueryRequest, db: Session = Depends(get_db)):
    """
    Execute grounded RAG query against government scheme official documentation.
    Returns answer, confidence rating, page citations, and retrieval diagnostics.
    """
    try:
        service = RAGService(db)
        return service.answer_query(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query execution failed: {str(e)}",
        )
