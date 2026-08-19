import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from server.database import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(
        String(36), ForeignKey("projects.id"), nullable=False, index=True
    )
    description = Column(String(255), nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    entry_date = Column(Date, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    type = Column(String(20), nullable=False, default="manual")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    project = relationship("Project", back_populates="time_entries")


# Composite index for daily summary performance: (entry_date, project_id)
Index("ix_time_entries_date_project", TimeEntry.entry_date, TimeEntry.project_id)
