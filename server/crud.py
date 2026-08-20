from typing import List, Optional
from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server import models, schemas


def format_duration(seconds: int) -> str:
    if seconds <= 0:
        return "0h 0m"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours}h {minutes}m"


def get_projects(db: Session) -> List[models.Project]:
    return db.query(models.Project).all()


def get_project_by_id(db: Session, project_id: str) -> Optional[models.Project]:
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def get_project_by_name(db: Session, name: str) -> Optional[models.Project]:
    return db.query(models.Project).filter(models.Project.name == name).first()


def create_project(db: Session, project_in: schemas.ProjectCreate) -> models.Project:
    existing = get_project_by_name(db, project_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with name '{project_in.name}' already exists",
        )

    project = models.Project(
        name=project_in.name, color_code=project_in.color_code.upper()
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(
    db: Session, project_id: str, project_in: schemas.ProjectUpdate
) -> models.Project:
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if project_in.name is not None and project_in.name != project.name:
        existing = get_project_by_name(db, project_in.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project with name '{project_in.name}' already exists",
            )
        project.name = project_in.name

    if project_in.color_code is not None:
        project.color_code = project_in.color_code.upper()

    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: str) -> None:
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    linked_entries_count = (
        db.query(models.TimeEntry)
        .filter(models.TimeEntry.project_id == project_id)
        .count()
    )
    if linked_entries_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete project '{project.name}' because it has existing time entries linked to it.",
        )

    db.delete(project)
    db.commit()


def create_time_entry(
    db: Session, entry_in: schemas.TimeEntryCreate
) -> models.TimeEntry:
    project = get_project_by_id(db, entry_in.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with ID '{entry_in.project_id}' not found",
        )

    entry_date = entry_in.entry_date or datetime.now(timezone.utc).date()

    entry = models.TimeEntry(
        project_id=entry_in.project_id,
        duration_seconds=entry_in.duration_seconds,
        description=entry_in.description,
        entry_date=entry_date,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_time_entries(
    db: Session, target_date: Optional[date] = None
) -> List[models.TimeEntry]:
    query = db.query(models.TimeEntry)
    if target_date:
        query = query.filter(models.TimeEntry.entry_date == target_date)
    return query.all()


def get_daily_summary(db: Session, target_date: date) -> schemas.DailySummaryResponse:
    entries = (
        db.query(models.TimeEntry)
        .filter(models.TimeEntry.entry_date == target_date)
        .all()
    )

    project_durations = {}
    total_seconds = 0

    for entry in entries:
        total_seconds += entry.duration_seconds
        pid = entry.project_id
        if pid not in project_durations:
            project_durations[pid] = 0
        project_durations[pid] += entry.duration_seconds

    project_items = []
    for pid, duration in project_durations.items():
        project = get_project_by_id(db, pid)
        if project:
            project_items.append(
                schemas.ProjectSummaryItem(
                    project_id=project.id,
                    project_name=project.name,
                    color_code=project.color_code,
                    duration_seconds=duration,
                    formatted_duration=format_duration(duration),
                )
            )

    return schemas.DailySummaryResponse(
        date=target_date,
        total_duration_seconds=total_seconds,
        formatted_total=format_duration(total_seconds),
        projects=project_items,
    )
