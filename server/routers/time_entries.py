from datetime import date
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
    format_seconds_to_hm,
)

router = APIRouter(prefix="/api/v1/time-entries", tags=["time-entries"])

@router.get("/daily-summary", response_model=DailySummaryResponse)
def get_daily_summary(
    entry_date: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db)
):
    target_date = entry_date or date.today()
    
    # Query time entries for target_date with joined project
    entries = (
        db.query(TimeEntry)
        .options(joinedload(TimeEntry.project))
        .filter(TimeEntry.entry_date == target_date)
        .all()
    )
    
    total_seconds = sum(e.duration_seconds for e in entries)
    
    # Group by project
    project_map = {}
    for entry in entries:
        pid = entry.project_id
        if pid not in project_map:
            project_map[pid] = {
                "project_id": pid,
                "project_name": entry.project.name if entry.project else "Unknown",
                "color_code": entry.project.color_code if entry.project else "#6B7280",
                "total_duration_seconds": 0,
                "entries_count": 0,
            }
        project_map[pid]["total_duration_seconds"] += entry.duration_seconds
        project_map[pid]["entries_count"] += 1
        
    project_summaries = []
    for pid, data in project_map.items():
        project_summaries.append(
            ProjectSummary(
                project_id=data["project_id"],
                project_name=data["project_name"],
                color_code=data["color_code"],
                total_duration_seconds=data["total_duration_seconds"],
                formatted_duration=format_seconds_to_hm(data["total_duration_seconds"]),
                entries_count=data["entries_count"],
            )
        )
        
    return DailySummaryResponse(
        date=target_date,
        total_duration_seconds=total_seconds,
        formatted_total=format_seconds_to_hm(total_seconds),
        projects=project_summaries,
    )

@router.get("", response_model=List[TimeEntryResponse])
def list_time_entries(
    entry_date: Optional[date] = Query(None, alias="date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(TimeEntry).options(joinedload(TimeEntry.project))
    if entry_date:
        query = query.filter(TimeEntry.entry_date == entry_date)
    return query.order_by(TimeEntry.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def create_time_entry(entry_in: TimeEntryCreate, db: Session = Depends(get_db)):
    if not entry_in.project_id or not entry_in.project_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project selection is mandatory."
        )
        
    # Verify project exists
    project = db.query(Project).filter(Project.id == entry_in.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project_id provided."
        )
        
    time_entry = TimeEntry(
        project_id=entry_in.project_id,
        duration_seconds=entry_in.duration_seconds,
        description=entry_in.description,
        entry_date=entry_in.entry_date,
    )
    
    db.add(time_entry)
    db.commit()
    db.refresh(time_entry)
    time_entry.project = project
    return time_entry

@router.get("/{time_entry_id}", response_model=TimeEntryResponse)
def get_time_entry(time_entry_id: str, db: Session = Depends(get_db)):
    entry = (
        db.query(TimeEntry)
        .options(joinedload(TimeEntry.project))
        .filter(TimeEntry.id == time_entry_id)
        .first()
    )
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found."
        )
    return entry

@router.delete("/{time_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_entry(time_entry_id: str, db: Session = Depends(get_db)):
    entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found."
        )
    db.delete(entry)
    db.commit()
    return None
