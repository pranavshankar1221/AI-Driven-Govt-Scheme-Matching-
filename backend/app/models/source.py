import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.core.database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(String(100), unique=True, index=True, nullable=False)
    domain = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    authority_score = Column(Float, default=1.0)  # 1.0 = official ministry/corporation, 0.8 = affiliated, 0.5 = secondary
    last_crawled_at = Column(DateTime, default=datetime.datetime.utcnow)
