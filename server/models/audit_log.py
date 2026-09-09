import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from server.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transaction_id = Column(
        String(36), ForeignKey("transactions.id"), nullable=True, index=True
    )
    action = Column(String(50), nullable=False, index=True)
    actor_id = Column(String(100), nullable=False, default="system")
    masked_payload = Column(JSON, nullable=False)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )

    transaction = relationship("Transaction", back_populates="audit_logs")
