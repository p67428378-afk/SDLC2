import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


HEX_COLOR_REGEX = r"^#[0-9A-Fa-f]{6}$"


class ProjectBase(BaseModel):
    name: str = Field(..., max_length=100, description="Project name")
    color_code: str = Field(..., description="Hex color code in #RRGGBB format")

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Project name cannot be blank")
        return s

    @field_validator("color_code")
    @classmethod
    def validate_color_code(cls, v: str) -> str:
        if not re.match(HEX_COLOR_REGEX, v):
            raise ValueError("Invalid hex color code format. Expected #RRGGBB")
        return v.upper()


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    color_code: Optional[str] = Field(None)

    @field_validator("name")
    @classmethod
    def validate_name_if_present(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip()
            if not s:
                raise ValueError("Project name cannot be blank")
            return s
        return v

    @field_validator("color_code")
    @classmethod
    def validate_color_if_present(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.match(HEX_COLOR_REGEX, v):
                raise ValueError("Invalid hex color code format. Expected #RRGGBB")
            return v.upper()
        return v


class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
