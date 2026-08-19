from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.database import get_db
from server.models.project import Project
from server.models.time_entry import TimeEntry
from server.schemas.time_entry import (
    TimeEntryCreate,
    TimeEntryResponse,
    DailySummaryResponse,
    DailySummaryProject,
)

router = APIRouter(prefix="/api/v1/time-entries", tags=["time-entries"])


def format_seconds_to_hm(total_seconds: int) -> str:
    if not total_seconds or total_seconds <= 0:
        return "0h 0m"
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    return f"{hours}h {minutes}m"


@router.post("", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def create_time_entry(entry_in: TimeEntryCreate, db: Session = Depends(get_db)):
    """Create time entry requiring valid project_id."""
    # Check if project exists
    project = db.query(Project).filter(Project.id == entry_in.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with id '{entry_in.project_id}' does not exist",
        )

    entry = TimeEntry(
        project_id=entry_in.project_id,
        description=entry_in.description,
        duration_seconds=entry_in.duration_seconds,
        entry_date=entry_in.entry_date,
        type=entry_in.type,
        started_at=entry_in.started_at,
        ended_at=entry_in.ended_at,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("", response_model=List[TimeEntryResponse])
@router.get("/", response_model=List[TimeEntryResponse])
def list_time_entries(
    entry_date: Optional[date] = None,
    project_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List time entries filtered by entry_date or project_id."""
    query = db.query(TimeEntry)
    if entry_date:
        query = query.filter(TimeEntry.entry_date == entry_date)
    if project_id:
        query = query.filter(TimeEntry.project_id == project_id)
    return query.order_by(TimeEntry.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/daily-summary", response_model=DailySummaryResponse)
def get_daily_summary(
    entry_date: Optional[date] = None,
    date_param: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    """Get daily total duration grouped by project with color codes."""
    target_date = entry_date or date_param or date.today()

    # Query sum of duration grouped by project for target_date
    results = (
        db.query(
            Project.id.label("project_id"),
            Project.name.label("project_name"),
            Project.color_code.label("color_code"),
            func.coalesce(func.sum(TimeEntry.duration_seconds), 0).label(
                "duration_seconds"
            ),
        )
        .join(TimeEntry, TimeEntry.project_id == Project.id)
        .filter(TimeEntry.entry_date == target_date)
        .group_by(Project.id, Project.name, Project.color_code)
        .all()
    )

    project_summaries = []
    total_duration = 0

    for row in results:
        dur = int(row.duration_seconds)
        total_duration += dur
        project_summaries.append(
            DailySummaryProject(
                project_id=row.project_id,
                project_name=row.project_name,
                color_code=row.color_code,
                duration_seconds=dur,
                formatted_duration=format_seconds_to_hm(dur),
            )
        )

    return DailySummaryResponse(
        entry_date=target_date,
        total_duration_seconds=total_duration,
        formatted_total=format_seconds_to_hm(total_duration),
        projects=project_summaries,
    )
