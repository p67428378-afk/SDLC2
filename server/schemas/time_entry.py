from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator
from server.schemas.project import ProjectResponse


class TimeEntryCreate(BaseModel):
    project_id: str = Field(..., description="Mandatory project ID")
    duration_seconds: int = Field(..., gt=0, description="Duration in seconds")
    description: Optional[str] = None
    entry_date: date = Field(..., description="Entry date (YYYY-MM-DD)")

    @field_validator("project_id")
    @classmethod
    def validate_project_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Project selection is mandatory.")
        return v.strip()


class TimeEntryResponse(BaseModel):
    id: str
    project_id: str
    duration_seconds: int
    description: Optional[str] = None
    entry_date: date
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
