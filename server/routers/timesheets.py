from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from server.database import get_db
from server.models.user import User
from server.models.project import Project
from server.models.timesheet import TimesheetEntry
from server.schemas.timesheet import (
    TimesheetEntryCreate,
    TimesheetEntryUpdate,
    TimesheetEntryResponse,
    TimesheetApprove,
    BulkApproveRequest,
    TimesheetSummaryResponse,
)
from server.services.auth import get_current_user, require_role
from server.services.timesheet import get_timesheet_summary

router = APIRouter(prefix="/timesheets", tags=["timesheets"])


@router.get("/summary", response_model=TimesheetSummaryResponse)
def get_summary(
    timeframe: str = Query("weekly", pattern="^(weekly|monthly)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_user_id = user_id
    if current_user.role == "Employee":
        target_user_id = current_user.id

    return get_timesheet_summary(
        db=db,
        user_id=target_user_id,
        timeframe=timeframe,
        start_date=start_date,
        end_date=end_date,
    )


@router.put("/bulk-approve", response_model=List[TimesheetEntryResponse])
def bulk_approve_timesheets(
    payload: BulkApproveRequest,
    current_user: User = Depends(require_role("Manager")),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(TimesheetEntry)
        .options(
            joinedload(TimesheetEntry.user),
            joinedload(TimesheetEntry.project),
        )
        .filter(TimesheetEntry.id.in_(payload.entry_ids))
        .all()
    )

    for entry in entries:
        entry.status = payload.status

    db.commit()
    for entry in entries:
        db.refresh(entry)

    return entries


@router.get("", response_model=List[TimesheetEntryResponse])
def list_timesheets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, alias="status"),
    project_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimesheetEntry).options(
        joinedload(TimesheetEntry.user),
        joinedload(TimesheetEntry.project),
    )

    if current_user.role == "Employee":
        query = query.filter(TimesheetEntry.user_id == current_user.id)
    elif user_id:
        query = query.filter(TimesheetEntry.user_id == user_id)

    if status_filter:
        query = query.filter(TimesheetEntry.status == status_filter)

    if project_id:
        query = query.filter(TimesheetEntry.project_id == project_id)

    if start_date:
        query = query.filter(TimesheetEntry.date >= start_date)

    if end_date:
        query = query.filter(TimesheetEntry.date <= end_date)

    entries = (
        query.order_by(TimesheetEntry.date.desc(), TimesheetEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return entries


@router.post(
    "", response_model=TimesheetEntryResponse, status_code=status.HTTP_201_CREATED
)
def create_timesheet_entry(
    entry_in: TimesheetEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == entry_in.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if not project.active_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot log hours against an inactive project",
        )

    entry = TimesheetEntry(
        user_id=current_user.id,
        project_id=entry_in.project_id,
        date=entry_in.date,
        hours_worked=entry_in.hours_worked,
        description=entry_in.description,
        status="pending",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Eagerly load user and project for serialization
    entry = (
        db.query(TimesheetEntry)
        .options(
            joinedload(TimesheetEntry.user),
            joinedload(TimesheetEntry.project),
        )
        .filter(TimesheetEntry.id == entry.id)
        .first()
    )
    return entry


@router.get("/{timesheet_id}", response_model=TimesheetEntryResponse)
def get_timesheet_entry(
    timesheet_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(TimesheetEntry)
        .options(
            joinedload(TimesheetEntry.user),
            joinedload(TimesheetEntry.project),
        )
        .filter(TimesheetEntry.id == timesheet_id)
        .first()
    )
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet entry not found",
        )

    if current_user.role == "Employee" and entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this timesheet entry",
        )

    return entry


@router.put("/{timesheet_id}", response_model=TimesheetEntryResponse)
def update_timesheet_entry(
    timesheet_id: str,
    entry_in: TimesheetEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(TimesheetEntry)
        .options(
            joinedload(TimesheetEntry.user),
            joinedload(TimesheetEntry.project),
        )
        .filter(TimesheetEntry.id == timesheet_id)
        .first()
    )
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet entry not found",
        )

    if current_user.role == "Employee" and entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this timesheet entry",
        )

    if entry.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a timesheet entry that is not in pending status",
        )

    if entry_in.project_id is not None:
        project = db.query(Project).filter(Project.id == entry_in.project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )
        if not project.active_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot log hours against an inactive project",
            )
        entry.project_id = entry_in.project_id

    if entry_in.date is not None:
        entry.date = entry_in.date
    if entry_in.hours_worked is not None:
        entry.hours_worked = entry_in.hours_worked
    if entry_in.description is not None:
        entry.description = entry_in.description

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timesheet_entry(
    timesheet_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(TimesheetEntry).filter(TimesheetEntry.id == timesheet_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet entry not found",
        )

    if current_user.role == "Employee" and entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this timesheet entry",
        )

    if entry.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a timesheet entry that is not in pending status",
        )

    db.delete(entry)
    db.commit()
    return None


@router.put("/{timesheet_id}/approve", response_model=TimesheetEntryResponse)
def approve_timesheet_entry(
    timesheet_id: str,
    payload: TimesheetApprove,
    current_user: User = Depends(require_role("Manager")),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(TimesheetEntry)
        .options(
            joinedload(TimesheetEntry.user),
            joinedload(TimesheetEntry.project),
        )
        .filter(TimesheetEntry.id == timesheet_id)
        .first()
    )
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet entry not found",
        )

    entry.status = payload.status
    db.commit()
    db.refresh(entry)
    return entry
