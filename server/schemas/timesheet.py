from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict
from server.schemas.auth import UserResponse
from server.schemas.project import ProjectResponse


class TimesheetEntryBase(BaseModel):
    project_id: str
    date: date
    hours_worked: float = Field(..., gt=0.0, le=24.0)
    description: Optional[str] = None


class TimesheetEntryCreate(BaseModel):
    project_id: str
    date: date
    hours_worked: float = Field(..., ge=0.1, le=24.0)
    description: Optional[str] = None


class TimesheetEntryUpdate(BaseModel):
    project_id: Optional[str] = None
    date: Optional[date] = None
    hours_worked: Optional[float] = Field(None, ge=0.1, le=24.0)
    description: Optional[str] = None


class TimesheetEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    project_id: str
    date: date
    hours_worked: float
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    project: Optional[ProjectResponse] = None


class TimesheetApprove(BaseModel):
    status: Literal["approved", "rejected"]


class BulkApproveRequest(BaseModel):
    entry_ids: List[str]
    status: Literal["approved", "rejected"]


class TimesheetSummaryItem(BaseModel):
    project_id: str
    project_name: str
    total_hours: float
    entry_count: int


class TimesheetSummaryResponse(BaseModel):
    timeframe: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_hours: float
    items: List[TimesheetSummaryItem] = Field(default_factory=list)
