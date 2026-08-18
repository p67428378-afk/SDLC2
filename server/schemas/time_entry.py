from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from server.schemas.project import ProjectResponse

def format_seconds_to_hm(seconds: int) -> str:
    if seconds <= 0:
        return "0h 0m"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours}h {minutes}m"

class TimeEntryBase(BaseModel):
    project_id: str = Field(..., description="Mandatory project ID")
    duration_seconds: int = Field(..., ge=1, description="Duration in seconds")
    description: Optional[str] = Field(None, description="Task description")
    entry_date: date = Field(default_factory=date.today, description="Entry date YYYY-MM-DD")

class TimeEntryCreate(TimeEntryBase):
    pass

class TimeEntryResponse(TimeEntryBase):
    id: str
    created_at: datetime
    updated_at: datetime
    project: Optional[ProjectResponse] = None

    class Config:
        from_attributes = True

class ProjectSummary(BaseModel):
    project_id: str
    project_name: str
    color_code: str
    total_duration_seconds: int
    formatted_duration: str
    entries_count: int

class DailySummaryResponse(BaseModel):
    date: date
    total_duration_seconds: int
    formatted_total: str
    projects: List[ProjectSummary]
