import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=True)
    disabled = Column(Boolean, default=False)

    # Relationships
    mortgage_accounts = relationship(
        "MortgageAccount", back_populates="customer", cascade="all, delete-orphan"
    )
    funding_accounts = relationship(
        "FundingAccount", back_populates="customer", cascade="all, delete-orphan"
    )
    payments = relationship(
        "MortgagePayment", back_populates="customer", cascade="all, delete-orphan"
    )


class MortgageAccount(Base):
    __tablename__ = "mortgage_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    loan_number = Column(String(50), unique=True, nullable=False)
    current_balance = Column(Numeric(12, 2), nullable=False)
    minimum_payment_amount = Column(Numeric(12, 2), nullable=False)
    next_payment_due_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    interest_rate = Column(Numeric(5, 2), nullable=False)
    escrow_balance = Column(Numeric(12, 2), nullable=False)

    # Relationships
    customer = relationship("User", back_populates="mortgage_accounts")


class FundingAccount(Base):
    __tablename__ = "funding_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    account_id = Column(String(50), nullable=False)
    account_name = Column(String(100), nullable=False)
    account_type = Column(String(20), nullable=False)  # DDA or Savings
    balance = Column(Numeric(12, 2), nullable=False)

    # Relationships
    customer = relationship("User", back_populates="funding_accounts")


class MortgagePayment(Base):
    __tablename__ = "mortgage_payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    loan_number = Column(String(50), nullable=False)
    from_account_id = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    payment_date = Column(Date, nullable=False)
    status = Column(
        String(20), nullable=False
    )  # SUBMITTED, PROCESSED, FAILED, SCHEDULED
    fiserv_transaction_id = Column(String(100), nullable=True)
    cenlar_confirmation_id = Column(String(100), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    customer = relationship("User", back_populates="payments")
    audit_logs = relationship(
        "PaymentAuditLog", back_populates="payment", cascade="all, delete-orphan"
    )


class PaymentAuditLog(Base):
    __tablename__ = "payment_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_id = Column(
        String(36),
        ForeignKey("mortgage_payments.id", ondelete="CASCADE"),
        nullable=False,
    )
    action = Column(String(50), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    payment = relationship("MortgagePayment", back_populates="audit_logs")
