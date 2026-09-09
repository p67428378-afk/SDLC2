import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from server.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class ExchangeRateCache(Base):
    __tablename__ = "exchange_rate_caches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    base_currency = Column(String(3), nullable=False, index=True)
    target_currency = Column(String(3), nullable=False, index=True)
    rate = Column(Float, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
