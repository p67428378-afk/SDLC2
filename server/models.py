import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Text, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        String(50), nullable=False, default="Employee"
    )  # "Employee" | "Manager"
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    timesheet_entries = relationship(
        "TimesheetEntry", back_populates="user", cascade="all, delete-orphan"
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    active_status = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    timesheet_entries = relationship(
        "TimesheetEntry", back_populates="project", cascade="all, delete-orphan"
    )


class TimesheetEntry(Base):
    __tablename__ = "timesheet_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id = Column(
        String(36),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date = Column(Date, nullable=False, index=True)
    hours_worked = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(
        String(50), default="pending", nullable=False, index=True
    )  # "pending", "approved", "rejected"
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    user = relationship("User", back_populates="timesheet_entries")
    project = relationship("Project", back_populates="timesheet_entries")
