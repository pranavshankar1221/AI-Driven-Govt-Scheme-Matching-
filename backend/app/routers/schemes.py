from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.scheme_repository import SchemeRepository

router = APIRouter(prefix="/schemes", tags=["Scheme Metadata"])


@router.get("")
def list_schemes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List structured scheme metadata records."""
    return SchemeRepository.list_all(db, skip=skip, limit=limit)


@router.get("/{scheme_id}")
def get_scheme(scheme_id: str, db: Session = Depends(get_db)):
    """Get metadata record for a specific scheme."""
    scheme = SchemeRepository.get_by_scheme_id(db, scheme_id)
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
    return scheme
