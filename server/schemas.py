from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from enum import Enum


class TimeEntryType(str, Enum):
    timed = "timed"
    manual = "manual"


class TimeEntryCreate(BaseModel):
    id: Optional[str] = None
    type: TimeEntryType
    description: Optional[str] = None
    duration_seconds: Optional[int] = None
    duration_string: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    logged_date: Optional[date] = None


class TimeEntryResponse(BaseModel):
    id: str
    type: str
    description: Optional[str] = None
    duration_seconds: int
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    logged_date: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailySummaryResponse(BaseModel):
    entries: List[TimeEntryResponse]
    total_duration_seconds: int

    model_config = ConfigDict(from_attributes=True)
