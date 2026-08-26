from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    active_status: bool = True


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    active_status: bool = True


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active_status: Optional[bool] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    active_status: bool
    created_at: datetime
    updated_at: datetime
