import re
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    color_code: str = Field(..., description="Hex color code in #RRGGBB format")

    @field_validator("color_code")
    @classmethod
    def validate_color_code(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Invalid color code format. Must be hex format #RRGGBB")
        return v.upper()


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    color_code: Optional[str] = Field(
        None, description="Hex color code in #RRGGBB format"
    )

    @field_validator("color_code")
    @classmethod
    def validate_color_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
                raise ValueError(
                    "Invalid color code format. Must be hex format #RRGGBB"
                )
            return v.upper()
        return v


class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TimeEntryBase(BaseModel):
    project_id: str
    duration_seconds: int = Field(..., ge=1)
    description: Optional[str] = Field(None, max_length=500)
    entry_date: Optional[date] = None


class TimeEntryCreate(TimeEntryBase):
    pass


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


class ProjectSummaryItem(BaseModel):
    project_id: str
    project_name: str
    color_code: str
    duration_seconds: int
    formatted_duration: str


class DailySummaryResponse(BaseModel):
    date: date
    total_duration_seconds: int
    formatted_total: str
    projects: List[ProjectSummaryItem]
