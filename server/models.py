import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Numeric,
    Date,
    ForeignKey,
    func,
    Integer,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from server.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    fiserv_cif = Column(String(255), nullable=True)
    cenlar_customer_id = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    payments = relationship(
        "Payment", back_populates="user", cascade="all, delete-orphan"
    )
    scheduled_payments = relationship(
        "ScheduledPayment", back_populates="user", cascade="all, delete-orphan"
    )
    profile_changes = relationship(
        "ProfileChangeLog", back_populates="user", cascade="all, delete-orphan"
    )


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    idempotency_key = Column(String(36), unique=True, nullable=False)
    source_account_id = Column(String(255), nullable=False)
    mortgage_account_id = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), nullable=False)
    confirmation_number = Column(String(255), unique=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="payments")


class ScheduledPayment(Base):
    __tablename__ = "scheduled_payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    source_account_id = Column(String(255), nullable=False)
    mortgage_account_id = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="scheduled_payments")


class ProfileChangeLog(Base):
    __tablename__ = "profile_change_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    changed_fields_before = Column(JSON, nullable=False)
    changed_fields_after = Column(JSON, nullable=False)
    status = Column(String(50), nullable=False)
    live_sync_available = Column(Boolean, default=False, nullable=True)
    failure_reason = Column(String(255), nullable=True)
    compensation_applied = Column(Boolean, default=False, nullable=False)
    compensation_details = Column(JSON, nullable=True)
    timestamp = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="profile_changes")
