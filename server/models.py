import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Boolean,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=True, nullable=False)
    disabled = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    customer_id = Column(String(100), nullable=False, default="CUST-1001")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(255), nullable=False, index=True)
    source_account_id = Column(String(255), nullable=False)
    mortgage_account_id = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(
        String(50), nullable=False
    )  # PENDING, SCHEDULED, PROCESSING, COMPLETED, FAILED, REVERSED
    payment_type = Column(String(50), nullable=False)  # IMMEDIATE, SCHEDULED
    scheduled_date = Column(DateTime, nullable=True)
    transaction_reference = Column(String(255), unique=True, nullable=False)
    fiserv_transaction_id = Column(String(255), nullable=True)
    cenlar_transaction_id = Column(String(255), nullable=True)
    reversal_transaction_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    audit_logs = relationship(
        "PaymentAuditLog", back_populates="payment", cascade="all, delete-orphan"
    )


class PaymentAuditLog(Base):
    __tablename__ = "payment_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_id = Column(String(36), ForeignKey("payments.id"), nullable=False)
    step_name = Column(
        String(255), nullable=False
    )  # e.g., 'DEBIT_FISERV', 'POST_CENLAR', 'REVERSE_DEBIT'
    status = Column(String(50), nullable=False)  # SUCCESS, FAILURE, IN_PROGRESS
    request_payload = Column(JSON, nullable=True)
    response_payload = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    payment = relationship("Payment", back_populates="audit_logs")
