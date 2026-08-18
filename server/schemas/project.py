import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

HEX_COLOR_REGEX = re.compile(r"^#[0-9A-Fa-f]{6}$")

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Project name")
    color_code: str = Field(..., description="Hex color code e.g. #3B82F6")

    @field_validator("color_code")
    @classmethod
    def validate_color_code(cls, v: str) -> str:
        if not HEX_COLOR_REGEX.match(v):
            raise ValueError("Invalid hex color code format. Must be #RRGGBB.")
        return v.upper()

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color_code: Optional[str] = None

    @field_validator("color_code")
    @classmethod
    def validate_color_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not HEX_COLOR_REGEX.match(v):
            raise ValueError("Invalid hex color code format. Must be #RRGGBB.")
        return v.upper() if v else v

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
