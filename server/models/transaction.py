import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("checkout_sessions.id"), nullable=True)
    stripe_payment_intent_id = Column(
        String(100), unique=True, index=True, nullable=True
    )
    payment_method_type = Column(String(30), nullable=False, default="CREDIT_CARD")
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False)
    status = Column(String(30), nullable=False, default="PENDING")
    masked_card_details = Column(String(50), nullable=True)
    customer_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    session = relationship("CheckoutSession", back_populates="transactions")
    refunds = relationship(
        "Refund", back_populates="transaction", cascade="all, delete-orphan"
    )
    audit_logs = relationship(
        "AuditLog", back_populates="transaction", cascade="all, delete-orphan"
    )
