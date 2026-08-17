import re
from datetime import datetime, timezone, date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from server.models import TimeEntry, User, UserPreference
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
        total_seconds += float(seconds_match.group(1)) * 1
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
            db_entry.duration_minutes = int(db_entry.duration_seconds / 60)
        elif entry_in.duration_seconds is not None:
            db_entry.duration_seconds = entry_in.duration_seconds
            db_entry.duration_minutes = int(entry_in.duration_seconds / 60)
        elif entry_in.duration_string:
            db_entry.duration_seconds = parse_duration_string(entry_in.duration_string)
            db_entry.duration_minutes = int(db_entry.duration_seconds / 60)

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
        entry_type="TIMER" if entry_in.type.value == "timed" else "MANUAL",
        description=entry_in.description,
        duration_seconds=duration_seconds,
        duration_minutes=int(duration_seconds / 60),
        logged_date=logged_date,
        started_at=entry_in.started_at,
        ended_at=entry_in.ended_at,
        start_time=entry_in.started_at,
        end_time=entry_in.ended_at,
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


# User and Preferences CRUD
def get_or_create_default_user(db: Session) -> User:
    default_id = "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6"
    user = db.query(User).filter(User.id == default_id).first()
    if not user:
        user = User(id=default_id, email="user@example.com")
        db.add(user)
        db.flush()

        # Create default preferences
        pref = UserPreference(user_id=default_id, dark_mode=False, theme_mode="light")
        db.add(pref)
        db.commit()
        db.refresh(user)
    return user


def update_user_preferences(
    db: Session, user_id: str, dark_mode: bool
) -> UserPreference:
    pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not pref:
        pref = UserPreference(
            user_id=user_id,
            dark_mode=dark_mode,
            theme_mode="dark" if dark_mode else "light",
        )
        db.add(pref)
    else:
        pref.dark_mode = dark_mode
        pref.theme_mode = "dark" if dark_mode else "light"
        pref.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(pref)
    return pref


# --- NEW WORKSPEC CRUD OPERATIONS ---


def start_timer_new(
    db: Session, user_id: str, description: Optional[str] = None
) -> TimeEntry:
    now = datetime.now(timezone.utc)
    db_entry = TimeEntry(
        user_id=user_id,
        entry_type="TIMER",
        description=description,
        start_time=now,
        duration_minutes=0,
        # Old columns for compatibility
        type="timed",
        duration_seconds=0,
        logged_date=now.date(),
        started_at=now,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


def stop_timer_new(db: Session, user_id: str, timer_id: str) -> TimeEntry:
    db_entry = (
        db.query(TimeEntry)
        .filter(and_(TimeEntry.id == timer_id, TimeEntry.user_id == user_id))
        .first()
    )
    if not db_entry:
        raise ValueError("Timer not found")
    if db_entry.end_time is not None:
        raise ValueError("Timer already stopped")

    now = datetime.now(timezone.utc)
    db_entry.end_time = now
    db_entry.ended_at = now

    # Calculate duration
    start = ensure_utc(db_entry.start_time)
    end = ensure_utc(now)
    elapsed_seconds = int((end - start).total_seconds())
    db_entry.duration_seconds = elapsed_seconds
    db_entry.duration_minutes = int(elapsed_seconds / 60)

    db_entry.updated_at = now
    db.commit()
    db.refresh(db_entry)
    return db_entry


def create_manual_entry_new(
    db: Session, user_id: str, description: str, duration_minutes: int, entry_date: date
) -> TimeEntry:
    db_entry = TimeEntry(
        user_id=user_id,
        entry_type="MANUAL",
        description=description,
        duration_minutes=duration_minutes,
        logged_date=entry_date,
        # Old columns for compatibility
        type="manual",
        duration_seconds=duration_minutes * 60,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


def get_daily_summary_new(db: Session, user_id: str) -> dict:
    today = datetime.now(timezone.utc).date()
    # Fetch entries logged for today
    entries = (
        db.query(TimeEntry)
        .filter(and_(TimeEntry.user_id == user_id, TimeEntry.logged_date == today))
        .order_by(TimeEntry.created_at.desc())
        .all()
    )

    total_minutes = 0
    for entry in entries:
        if entry.entry_type == "TIMER" and entry.end_time is None:
            # Running timer: calculate real-time total running hours
            start = ensure_utc(entry.start_time)
            now = datetime.now(timezone.utc)
            elapsed_seconds = int((now - start).total_seconds())
            total_minutes += int(elapsed_seconds / 60)
        else:
            total_minutes += entry.duration_minutes

    # Format total as "Xh Ym"
    hours = total_minutes // 60
    minutes = total_minutes % 60
    formatted_total = f"{hours}h {minutes}m"

    return {
        "entries": entries,
        "formatted_total": formatted_total,
        "total_minutes": total_minutes,
    }


def update_user_preferences_new(
    db: Session, user_id: str, dark_mode: bool
) -> UserPreference:
    pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    theme_mode = "dark" if dark_mode else "light"
    now = datetime.now(timezone.utc)
    if not pref:
        pref = UserPreference(
            user_id=user_id,
            theme_mode=theme_mode,
            dark_mode=dark_mode,
            created_at=now,
            updated_at=now,
        )
        db.add(pref)
    else:
        pref.theme_mode = theme_mode
        pref.dark_mode = dark_mode
        pref.updated_at = now
    db.commit()
    db.refresh(pref)
    return pref
