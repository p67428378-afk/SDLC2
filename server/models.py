import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Date, DateTime
from server.database import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False,
    )
    type = Column(String(50), nullable=False)  # 'timed' or 'manual'
    description = Column(String(255), nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    logged_date = Column(
        Date, nullable=False, default=lambda: datetime.now(timezone.utc).date()
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
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
