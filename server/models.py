import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from server.database import Base


class User(Base):
    __tablename__ = "users"

    # Use String(36) or UUID for SQLite compatibility, but let's support both
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    fiserv_cif_id = Column(String(255), nullable=True)
    cenlar_customer_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
