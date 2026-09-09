import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4()}"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: generate_uuid("usr_"))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    role = Column(String, default="customer", nullable=False)  # customer, admin
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    transactions = relationship("Transaction", back_populates="user")
    refunds_authorized = relationship("Refund", back_populates="actor")


class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id = Column(String, primary_key=True, default=lambda: generate_uuid("cs_"))
    session_token = Column(String, unique=True, index=True, nullable=False)
    customer_email = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    status = Column(
        String, default="PENDING", nullable=False
    )  # PENDING, COMPLETED, EXPIRED
    items = Column(JSON, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: generate_uuid("tx_"))
    payment_intent_id = Column(String, unique=True, index=True, nullable=False)
    session_id = Column(String, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    customer_email = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    base_currency = Column(String, default="USD", nullable=False)
    target_currency = Column(String, default="USD", nullable=False)
    converted_amount = Column(Float, nullable=False)
    exchange_rate = Column(Float, default=1.0, nullable=False)
    payment_method = Column(
        String, default="card", nullable=False
    )  # card, apple_pay, google_pay
    status = Column(
        String, default="PENDING", nullable=False, index=True
    )  # PENDING, COMPLETED, PARTIALLY_REFUNDED, REFUNDED, FAILED
    refunded_amount = Column(Float, default=0.0, nullable=False)
    remaining_refundable_balance = Column(Float, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="transactions")
    refunds = relationship(
        "Refund",
        back_populates="transaction",
        cascade="all, delete-orphan",
        order_by="Refund.created_at.desc()",
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="transaction",
        cascade="all, delete-orphan",
        order_by="AuditLog.created_at.desc()",
    )


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(String, primary_key=True, default=lambda: generate_uuid("ref_"))
    transaction_id = Column(
        String, ForeignKey("transactions.id"), nullable=False, index=True
    )
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    refund_amount = Column(Float, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    status = Column(
        String, default="SUCCEEDED", nullable=False
    )  # SUCCEEDED, PENDING, FAILED
    reason = Column(String, nullable=False)
    memo = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    transaction = relationship("Transaction", back_populates="refunds")
    actor = relationship("User", back_populates="refunds_authorized")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: generate_uuid("audit_"))
    transaction_id = Column(
        String, ForeignKey("transactions.id"), nullable=True, index=True
    )
    event_type = Column(
        String, nullable=False, index=True
    )  # payment_created, payment_succeeded, refund_created, webhook_received
    masked_payload = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    transaction = relationship("Transaction", back_populates="audit_logs")


class ExchangeRateCache(Base):
    __tablename__ = "exchange_rate_caches"

    id = Column(String, primary_key=True, default=lambda: generate_uuid("rate_"))
    base_currency = Column(String, nullable=False, default="USD")
    target_currency = Column(String, nullable=False)
    rate = Column(Float, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
