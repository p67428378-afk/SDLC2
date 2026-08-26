from datetime import date, timedelta
from typing import Optional
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from server.database import get_db
from server.deps import get_current_user, require_manager
from server.models import Project, TimesheetEntry, User
from server.schemas import (
    BulkApprovalRequest,
    BulkApprovalResponse,
    ProjectHoursSummary,
    TimesheetApproval,
    TimesheetCreate,
    TimesheetResponse,
    TimesheetSummaryResponse,
    TimesheetUpdate,
)

router = APIRouter()


@router.get("/summary", response_model=TimesheetSummaryResponse)
def get_timesheet_summary(
    period: str = Query(default="weekly", description="'weekly' or 'monthly'"),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    project_id: Optional[str] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Set default date boundaries if not provided
    today = date.today()
    if not start_date or not end_date:
        if period == "monthly":
            start_date = start_date or today.replace(day=1)
            next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            end_date = end_date or (next_month - timedelta(days=1))
        else:  # weekly
            # Start of current week (Monday)
            start_date = start_date or (today - timedelta(days=today.weekday()))
            end_date = end_date or (start_date + timedelta(days=6))

    query = (
        db.query(TimesheetEntry)
        .options(
            joinedload(TimesheetEntry.project),
            joinedload(TimesheetEntry.user),
        )
        .filter(
            TimesheetEntry.date >= start_date,
            TimesheetEntry.date <= end_date,
        )
    )

    if current_user.role == "Employee":
        query = query.filter(TimesheetEntry.user_id == current_user.id)
    else:
        if user_id:
            query = query.filter(TimesheetEntry.user_id == user_id)

    if project_id:
        query = query.filter(TimesheetEntry.project_id == project_id)

    entries = query.all()

    total_hours = sum(e.hours_worked for e in entries)
    project_hours_map = defaultdict(lambda: {"name": "", "hours": 0.0})
    status_hours_map = {"pending": 0.0, "approved": 0.0, "rejected": 0.0}

    for entry in entries:
        proj_name = entry.project.name if entry.project else "Unknown Project"
        project_hours_map[entry.project_id]["name"] = proj_name
        project_hours_map[entry.project_id]["hours"] += entry.hours_worked

        st = entry.status.lower()
        if st in status_hours_map:
            status_hours_map[st] += entry.hours_worked
        else:
            status_hours_map[st] = entry.hours_worked

    by_project = [
        ProjectHoursSummary(
            project_id=p_id,
            project_name=p_data["name"],
            hours=round(p_data["hours"], 2),
        )
        for p_id, p_data in project_hours_map.items()
    ]

    return TimesheetSummaryResponse(
        period=period,
        start_date=start_date,
        end_date=end_date,
        total_hours=round(total_hours, 2),
        by_project=by_project,
        by_status={k: round(v, 2) for k, v in status_hours_map.items()},
    )


@router.put("/bulk-approve", response_model=BulkApprovalResponse)
def bulk_approve_timesheets(
    approval_in: BulkApprovalRequest,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    if approval_in.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'approved' or 'rejected'",
        )

    entries = (
        db.query(TimesheetEntry)
        .filter(TimesheetEntry.id.in_(approval_in.entry_ids))
        .all()
    )
    count = 0
    for entry in entries:
        entry.status = approval_in.status
        if approval_in.rejection_reason:
            entry.rejection_reason = approval_in.rejection_reason
        count += 1

    db.commit()
    return BulkApprovalResponse(updated_count=count, status=approval_in.status)


@router.get("", response_model=list[TimesheetResponse])
def list_timesheets(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
    project_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimesheetEntry).options(
        joinedload(TimesheetEntry.project),
        joinedload(TimesheetEntry.user),
    )

    if current_user.role == "Employee":
        if user_id and user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only view their own timesheet entries",
            )
        query = query.filter(TimesheetEntry.user_id == current_user.id)
    else:
        if user_id:
            query = query.filter(TimesheetEntry.user_id == user_id)

    if project_id:
        query = query.filter(TimesheetEntry.project_id == project_id)
    if status:
        query = query.filter(TimesheetEntry.status == status)
    if start_date:
        query = query.filter(TimesheetEntry.date >= start_date)
    if end_date:
        query = query.filter(TimesheetEntry.date <= end_date)

    entries = query.order_by(
        TimesheetEntry.date.desc(), TimesheetEntry.created_at.desc()
    ).all()
    return entries


@router.post("", response_model=TimesheetResponse, status_code=status.HTTP_201_CREATED)
def create_timesheet(
    entry_in: TimesheetCreate,
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
    return entry


@router.get("/{timesheet_id}", response_model=TimesheetResponse)
def get_timesheet(
    timesheet_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(TimesheetEntry)
        .options(
            joinedload(TimesheetEntry.project),
            joinedload(TimesheetEntry.user),
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
            detail="Access forbidden: cannot view another user's timesheet",
        )

    return entry


@router.put("/{timesheet_id}", response_model=TimesheetResponse)
def update_timesheet(
    timesheet_id: str,
    entry_in: TimesheetUpdate,
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
            detail="Access forbidden: cannot modify another user's timesheet",
        )

    if entry.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify timesheet entry once it has been approved or rejected",
        )

    update_data = entry_in.model_dump(exclude_unset=True)

    if "project_id" in update_data and update_data["project_id"] != entry.project_id:
        project = (
            db.query(Project).filter(Project.id == update_data["project_id"]).first()
        )
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )
        if not project.active_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign timesheet to an inactive project",
            )

    for field, value in update_data.items():
        if value is not None:
            setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timesheet(
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
            detail="Access forbidden: cannot delete another user's timesheet",
        )

    if entry.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete timesheet entry once it has been approved or rejected",
        )

    db.delete(entry)
    db.commit()
    return None


@router.put("/{timesheet_id}/approve", response_model=TimesheetResponse)
def approve_timesheet(
    timesheet_id: str,
    approval_in: TimesheetApproval,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    if approval_in.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'approved' or 'rejected'",
        )

    entry = (
        db.query(TimesheetEntry)
        .options(
            joinedload(TimesheetEntry.project),
            joinedload(TimesheetEntry.user),
        )
        .filter(TimesheetEntry.id == timesheet_id)
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet entry not found",
        )

    entry.status = approval_in.status
    if approval_in.rejection_reason is not None:
        entry.rejection_reason = approval_in.rejection_reason

    db.commit()
    db.refresh(entry)
    return entry
