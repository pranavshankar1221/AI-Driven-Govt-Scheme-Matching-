import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.core.database import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(String(100), unique=True, index=True, nullable=False)
    scheme_name = Column(String(255), nullable=False)
    organization = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=True)  # business, education, livelihood, skill, financial_assistance
    target_group = Column(String(255), nullable=True)  # OBC, SC, ST, Women, Minority, General, Persons with Disabilities
    state_scope = Column(String(100), default="All-India")
    income_limit = Column(Float, nullable=True)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    purpose = Column(Text, nullable=True)
    max_loan_amount = Column(Float, nullable=True)
    interest_rate = Column(Float, nullable=True)
    repayment_period = Column(Integer, nullable=True)  # in months or years
    moratorium = Column(Integer, nullable=True)  # in months
    contribution = Column(Float, nullable=True)  # beneficiary/SCA percentage
    channel_partner = Column(String(255), nullable=True)
    application_mode = Column(String(100), default="Online/Offline Channel Partner")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
