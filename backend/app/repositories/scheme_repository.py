from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.scheme import Scheme


class SchemeRepository:
    @staticmethod
    def get_by_scheme_id(db: Session, scheme_id: str) -> Optional[Scheme]:
        return db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()

    @staticmethod
    def list_all(db: Session, skip: int = 0, limit: int = 100) -> List[Scheme]:
        return db.query(Scheme).offset(skip).limit(limit).all()

    @staticmethod
    def upsert(db: Session, scheme_data: dict) -> Scheme:
        scheme_id = scheme_data.get("scheme_id")
        existing = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first() if scheme_id else None
        if existing:
            for key, val in scheme_data.items():
                setattr(existing, key, val)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            scheme = Scheme(**scheme_data)
            db.add(scheme)
            db.commit()
            db.refresh(scheme)
            return scheme
