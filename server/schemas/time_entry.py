from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class TimeEntryBase(BaseModel):
    project_id: str = Field(..., description="Referenced Project UUID")
    description: Optional[str] = Field(None, max_length=255)
    duration_seconds: int = Field(0, ge=0, description="Duration in seconds")
    entry_date: date = Field(..., description="Entry date YYYY-MM-DD")
    type: str = Field("manual", description="Entry type: 'timer' or 'manual'")
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryResponse(TimeEntryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DailySummaryProject(BaseModel):
    project_id: str
    project_name: str
    color_code: str
    duration_seconds: int
    formatted_duration: str


class DailySummaryResponse(BaseModel):
    entry_date: date
    total_duration_seconds: int
    formatted_total: str
    projects: List[DailySummaryProject]
