import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(100), nullable=False, index=True)
    amount_original = Column(Float, nullable=False)
    currency_original = Column(String(3), nullable=False)
    amount_converted = Column(Float, nullable=False)
    currency_target = Column(String(3), nullable=False)
    exchange_rate = Column(Float, nullable=False, default=1.0)
    status = Column(String(30), nullable=False, default="CREATED")
    description = Column(String(255), nullable=True)
    payment_intent_id = Column(String(100), nullable=True, index=True)
    client_secret = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    transactions = relationship(
        "Transaction", back_populates="session", cascade="all, delete-orphan"
    )
