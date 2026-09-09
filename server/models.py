import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    JSON,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="customer", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction", back_populates="user"
    )
    refunds: Mapped[List["Refund"]] = relationship("Refund", back_populates="actor")


class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    payment_intent_id: Mapped[Optional[str]] = mapped_column(
        String(255), index=True, nullable=True
    )
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    base_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    base_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    target_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    target_currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="USD"
    )
    exchange_rate: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    client_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    items: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: f"tx_{uuid.uuid4().hex[:12]}"
    )
    payment_intent_id: Mapped[Optional[str]] = mapped_column(
        String(255), index=True, nullable=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    customer_email: Mapped[Optional[str]] = mapped_column(
        String(255), index=True, nullable=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    base_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    target_currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="USD"
    )
    converted_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    exchange_rate: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    payment_method: Mapped[str] = mapped_column(
        String(50), default="card", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default="COMPLETED", nullable=False
    )  # COMPLETED, PENDING, REFUNDED, PARTIALLY_REFUNDED, FAILED
    refunded_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    remaining_refundable_balance: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    user: Mapped[Optional[User]] = relationship("User", back_populates="transactions")
    refunds: Mapped[List["Refund"]] = relationship(
        "Refund", back_populates="transaction", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog", back_populates="transaction", cascade="all, delete-orphan"
    )


class Refund(Base):
    __tablename__ = "refunds"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: f"ref_{uuid.uuid4().hex[:12]}"
    )
    transaction_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("transactions.id"), nullable=False, index=True
    )
    actor_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    refund_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    memo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="SUCCEEDED", nullable=False
    )  # SUCCEEDED, PENDING, FAILED
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    transaction: Mapped[Transaction] = relationship(
        "Transaction", back_populates="refunds"
    )
    actor: Mapped[Optional[User]] = relationship("User", back_populates="refunds")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: f"aud_{uuid.uuid4().hex[:12]}"
    )
    transaction_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("transactions.id"), nullable=True, index=True
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    action: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    status_code: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, default=200
    )
    signature_valid: Mapped[Optional[bool]] = mapped_column(
        Boolean, nullable=True, default=True
    )
    masked_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )

    transaction: Mapped[Optional[Transaction]] = relationship(
        "Transaction", back_populates="audit_logs"
    )


class ExchangeRateCache(Base):
    __tablename__ = "exchange_rate_caches"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    base_currency: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    target_currency: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    rate: Mapped[float] = mapped_column(Float, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )
