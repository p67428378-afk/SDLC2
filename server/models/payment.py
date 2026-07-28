import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
    Integer,
    BigInteger,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=True)
    disabled = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)


class MortgageAccount(Base):
    __tablename__ = "mortgage_accounts"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(100), ForeignKey("users.id"), nullable=False)
    loan_number = Column(String(100), unique=True, nullable=False)
    outstanding_balance = Column(Numeric(12, 2), nullable=False)
    next_payment_due_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    minimum_payment_due = Column(Numeric(10, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    escrow_balance = Column(Numeric(12, 2), nullable=False)
    loan_term = Column(String(50), nullable=False)
    maturity_date = Column(String(10), nullable=False)  # YYYY-MM-DD


class FundingAccount(Base):
    __tablename__ = "funding_accounts"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(100), ForeignKey("users.id"), nullable=False)
    account_name = Column(String(100), nullable=False)
    account_type = Column(String(50), nullable=False)  # DDA or Savings
    available_balance = Column(Numeric(12, 2), nullable=False)
    masked_account_number = Column(String(50), nullable=False)


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    idempotency_key = Column(String(100), unique=True, nullable=False)
    customer_id = Column(String(100), ForeignKey("users.id"), nullable=False)
    mortgage_account_id = Column(
        String(100), ForeignKey("mortgage_accounts.id"), nullable=False
    )
    source_account_id = Column(
        String(100), ForeignKey("funding_accounts.id"), nullable=False
    )
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(
        String(50), nullable=False
    )  # PENDING, DEBITED, COMPLETED, FAILED, REVERSAL_PENDING, REVERSED, REVERSAL_FAILED
    fiserv_transaction_id = Column(String(100), nullable=True)
    cenlar_confirmation_id = Column(String(100), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    audit_logs = relationship("AuditLog", back_populates="payment_transaction")


class ScheduledPayment(Base):
    __tablename__ = "scheduled_payments"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(100), ForeignKey("users.id"), nullable=False)
    mortgage_account_id = Column(
        String(100), ForeignKey("mortgage_accounts.id"), nullable=False
    )
    source_account_id = Column(
        String(100), ForeignKey("funding_accounts.id"), nullable=False
    )
    amount = Column(Numeric(10, 2), nullable=False)
    frequency = Column(String(50), nullable=False)  # ONCE, MONTHLY
    start_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    payment_transaction_id = Column(
        String(100), ForeignKey("payment_transactions.id"), nullable=True
    )
    event_type = Column(String(100), nullable=False)
    event_details = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    payment_transaction = relationship(
        "PaymentTransaction", back_populates="audit_logs"
    )
