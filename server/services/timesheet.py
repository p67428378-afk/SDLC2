from datetime import date, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from server.models.timesheet import TimesheetEntry
from server.models.project import Project
from server.schemas.timesheet import (
    TimesheetSummaryResponse,
    TimesheetSummaryItem,
)


def get_timesheet_summary(
    db: Session,
    user_id: Optional[str] = None,
    timeframe: str = "weekly",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> TimesheetSummaryResponse:
    today = date.today()
    if not start_date or not end_date:
        if timeframe == "monthly":
            start_date = start_date or date(today.year, today.month, 1)
            # Find last day of month
            if today.month == 12:
                next_month = date(today.year + 1, 1, 1)
            else:
                next_month = date(today.year, today.month + 1, 1)
            end_date = end_date or (next_month - timedelta(days=1))
        else:
            # weekly default: start on Monday of current week
            weekday = today.weekday()
            start_date = start_date or (today - timedelta(days=weekday))
            end_date = end_date or (start_date + timedelta(days=6))

    query = (
        db.query(
            TimesheetEntry.project_id,
            Project.name.label("project_name"),
            func.sum(TimesheetEntry.hours_worked).label("total_hours"),
            func.count(TimesheetEntry.id).label("entry_count"),
        )
        .join(Project, TimesheetEntry.project_id == Project.id)
        .filter(
            TimesheetEntry.date >= start_date,
            TimesheetEntry.date <= end_date,
        )
    )

    if user_id:
        query = query.filter(TimesheetEntry.user_id == user_id)

    results = query.group_by(TimesheetEntry.project_id, Project.name).all()

    summary_items = []
    total_hours_sum = 0.0

    for r in results:
        hours = float(r.total_hours or 0.0)
        total_hours_sum += hours
        summary_items.append(
            TimesheetSummaryItem(
                project_id=r.project_id,
                project_name=r.project_name,
                total_hours=round(hours, 2),
                entry_count=int(r.entry_count or 0),
            )
        )

    return TimesheetSummaryResponse(
        timeframe=timeframe,
        start_date=start_date,
        end_date=end_date,
        total_hours=round(total_hours_sum, 2),
        items=summary_items,
    )
