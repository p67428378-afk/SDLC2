import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from server.database import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(
        String(36),
        ForeignKey("projects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    duration_seconds = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    entry_date = Column(Date, nullable=False, index=True)
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

    project = relationship("Project", back_populates="time_entries")
