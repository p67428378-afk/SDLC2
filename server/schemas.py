from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ----------------------
# User Schemas
# ----------------------
class UserBase(BaseModel):
    email: EmailStr
    role: str = Field(
        default="Employee", description="User role: 'Employee' or 'Manager'"
    )


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="User password")
    role: str = Field(default="Employee", description="Role: 'Employee' or 'Manager'")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ----------------------
# Project Schemas
# ----------------------
class ProjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    active_status: bool = True


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    active_status: Optional[bool] = None


class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------
# Timesheet Schemas
# ----------------------
class TimesheetCreate(BaseModel):
    project_id: str
    date: date
    hours_worked: float = Field(
        ge=0.1, le=24.0, description="Hours worked in a day (0.1 to 24)"
    )
    description: str = Field(min_length=1, description="Task description")


class TimesheetUpdate(BaseModel):
    project_id: Optional[str] = None
    date: Optional[date] = None
    hours_worked: Optional[float] = Field(default=None, ge=0.1, le=24.0)
    description: Optional[str] = Field(default=None, min_length=1)


class TimesheetApproval(BaseModel):
    status: str = Field(description="'approved' or 'rejected'")
    rejection_reason: Optional[str] = None


class BulkApprovalRequest(BaseModel):
    entry_ids: list[str]
    status: str = Field(description="'approved' or 'rejected'")
    rejection_reason: Optional[str] = None


class BulkApprovalResponse(BaseModel):
    updated_count: int
    status: str


class TimesheetResponse(BaseModel):
    id: str
    user_id: str
    project_id: str
    date: date
    hours_worked: float
    description: str
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    project: Optional[ProjectResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------
# Analytics Schemas
# ----------------------
class ProjectHoursSummary(BaseModel):
    project_id: str
    project_name: str
    hours: float


class TimesheetSummaryResponse(BaseModel):
    period: str
    start_date: date
    end_date: date
    total_hours: float
    by_project: list[ProjectHoursSummary]
    by_status: dict[str, float]
