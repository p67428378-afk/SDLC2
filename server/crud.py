import re
from datetime import datetime, timezone, date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from server.models import TimeEntry
from server.schemas import TimeEntryCreate, TimeEntryType


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_duration_string(duration_str: str) -> int:
    duration_str = duration_str.strip().lower()
    if not duration_str:
        raise ValueError("Empty duration string")

    # Try HH:MM:SS or HH:MM format
    time_match = re.match(r"^(\d+):(\d+)(?::(\d+))?$", duration_str)
    if time_match:
        hours = int(time_match.group(1))
        minutes = int(time_match.group(2))
        seconds = int(time_match.group(3)) if time_match.group(3) else 0
        return hours * 3600 + minutes * 60 + seconds

    # Try standard parts like 1h, 30m, 45s
    total_seconds = 0
    found = False

    # Match hours (supports decimals like 1.5h)
    hours_match = re.search(r"(\d+(?:\.\d+)?)\s*h", duration_str)
    if hours_match:
        total_seconds += float(hours_match.group(1)) * 3600
        found = True

    # Match minutes (supports decimals like 1.5m)
    minutes_match = re.search(r"(\d+(?:\.\d+)?)\s*m", duration_str)
    if minutes_match:
        total_seconds += float(minutes_match.group(1)) * 60
        found = True

    # Match seconds
    seconds_match = re.search(r"(\d+(?:\.\d+)?)\s*s", duration_str)
    if seconds_match:
        total_seconds += float(seconds_match.group(1))
        found = True

    if not found:
        # If it's just a plain number, let's treat it as minutes
        if re.match(r"^\d+$", duration_str):
            return int(duration_str) * 60
        raise ValueError("Invalid duration format")

    return int(total_seconds)


def create_time_entry(db: Session, entry_in: TimeEntryCreate) -> TimeEntry:
    # Check if we are updating an existing entry by ID
    db_entry = None
    if entry_in.id:
        db_entry = get_time_entry(db, entry_in.id)

    # If no ID is provided, but we are stopping a timer, check if there is an active running timer
    if not db_entry and entry_in.type == TimeEntryType.timed and entry_in.ended_at:
        # Find the most recent running timer (where ended_at is null)
        db_entry = (
            db.query(TimeEntry)
            .filter(and_(TimeEntry.type == "timed", TimeEntry.ended_at == None))
            .order_by(TimeEntry.created_at.desc())
            .first()
        )

    if db_entry:
        # Update existing entry (e.g., stopping a timer)
        if entry_in.description is not None:
            db_entry.description = entry_in.description
        if entry_in.started_at:
            db_entry.started_at = entry_in.started_at
        if entry_in.ended_at:
            db_entry.ended_at = entry_in.ended_at

        # Recalculate duration
        start = ensure_utc(db_entry.started_at or entry_in.started_at)
        end = ensure_utc(db_entry.ended_at or entry_in.ended_at)
        if start and end:
            if end < start:
                raise ValueError("ended_at cannot be before started_at")
            db_entry.duration_seconds = int((end - start).total_seconds())
        elif entry_in.duration_seconds is not None:
            db_entry.duration_seconds = entry_in.duration_seconds
        elif entry_in.duration_string:
            db_entry.duration_seconds = parse_duration_string(entry_in.duration_string)

        db_entry.updated_at = datetime.now(timezone.utc)
        return db_entry

    # Otherwise, create a new entry
    duration_seconds = 0
    if entry_in.started_at and entry_in.ended_at:
        start = ensure_utc(entry_in.started_at)
        end = ensure_utc(entry_in.ended_at)
        if end < start:
            raise ValueError("ended_at cannot be before started_at")
        duration_seconds = int((end - start).total_seconds())
    elif entry_in.duration_string:
        duration_seconds = parse_duration_string(entry_in.duration_string)
    elif entry_in.duration_seconds is not None:
        duration_seconds = entry_in.duration_seconds

    logged_date = entry_in.logged_date
    if not logged_date:
        if entry_in.started_at:
            logged_date = ensure_utc(entry_in.started_at).date()
        else:
            logged_date = datetime.now(timezone.utc).date()

    db_entry = TimeEntry(
        type=entry_in.type.value,
        description=entry_in.description,
        duration_seconds=duration_seconds,
        logged_date=logged_date,
        started_at=entry_in.started_at,
        ended_at=entry_in.ended_at,
    )
    db.add(db_entry)
    return db_entry


def get_time_entries(
    db: Session, date_filter: Optional[date] = None, skip: int = 0, limit: int = 100
) -> List[TimeEntry]:
    query = db.query(TimeEntry)
    if date_filter:
        query = query.filter(TimeEntry.logged_date == date_filter)
    return query.order_by(TimeEntry.created_at.desc()).offset(skip).limit(limit).all()


def get_today_time_entries(db: Session) -> List[TimeEntry]:
    today = datetime.now(timezone.utc).date()
    return (
        db.query(TimeEntry)
        .filter(TimeEntry.logged_date == today)
        .order_by(TimeEntry.created_at.desc())
        .all()
    )


def get_time_entry(db: Session, entry_id: str) -> Optional[TimeEntry]:
    return db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()


def delete_time_entry(db: Session, entry_id: str) -> bool:
    entry = get_time_entry(db, entry_id)
    if entry:
        db.delete(entry)
        return True
    return False
