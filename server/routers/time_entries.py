from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from server.database import get_db
from server.models.project import Project
from server.models.time_entry import TimeEntry
from server.schemas.time_entry import (
    TimeEntryCreate,
    TimeEntryResponse,
    DailySummaryResponse,
    ProjectSummary,
)

router = APIRouter(prefix="/api/v1/time-entries", tags=["Time Entries"])


def format_seconds(seconds: int) -> str:
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours}h {minutes}m"


@router.post("", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def create_time_entry(payload: TimeEntryCreate, db: Session = Depends(get_db)):
    if not payload.project_id or not payload.project_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project selection is mandatory.",
        )

    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project_id provided.",
        )

    time_entry = TimeEntry(
        project_id=payload.project_id,
        duration_seconds=payload.duration_seconds,
        description=payload.description,
        entry_date=payload.entry_date,
    )
    db.add(time_entry)
    db.commit()
    db.refresh(time_entry)
    return time_entry


@router.get("", response_model=List[TimeEntryResponse])
def list_time_entries(
    entry_date: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    query = db.query(TimeEntry).options(joinedload(TimeEntry.project))
    if entry_date:
        query = query.filter(TimeEntry.entry_date == entry_date)
    return query.order_by(TimeEntry.created_at.desc()).all()


@router.get("/daily-summary", response_model=DailySummaryResponse)
def get_daily_summary(
    target_date: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    if not target_date:
        target_date = date.today()

    entries = (
        db.query(TimeEntry)
        .options(joinedload(TimeEntry.project))
        .filter(TimeEntry.entry_date == target_date)
        .all()
    )

    total_seconds = sum(e.duration_seconds for e in entries)
    formatted_total = format_seconds(total_seconds)

    project_groups = {}
    for entry in entries:
        pid = entry.project_id
        if pid not in project_groups:
            project_groups[pid] = {
                "project_id": pid,
                "project_name": entry.project.name if entry.project else "Unknown",
                "color_code": entry.project.color_code if entry.project else "#6B7280",
                "total_duration_seconds": 0,
                "entries_count": 0,
            }
        project_groups[pid]["total_duration_seconds"] += entry.duration_seconds
        project_groups[pid]["entries_count"] += 1

    project_summaries = []
    for pg in project_groups.values():
        project_summaries.append(
            ProjectSummary(
                project_id=pg["project_id"],
                project_name=pg["project_name"],
                color_code=pg["color_code"],
                total_duration_seconds=pg["total_duration_seconds"],
                formatted_duration=format_seconds(pg["total_duration_seconds"]),
                entries_count=pg["entries_count"],
            )
        )

    project_summaries.sort(key=lambda x: x.total_duration_seconds, reverse=True)

    return DailySummaryResponse(
        date=target_date,
        total_duration_seconds=total_seconds,
        formatted_total=formatted_total,
        projects=project_summaries,
    )
