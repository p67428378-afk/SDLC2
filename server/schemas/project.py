import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color_code: str = Field(..., description="Hex color code format #RRGGBB")

    @field_validator("color_code")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Invalid hex color code format. Must be #RRGGBB.")
        return v.upper()

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("Project name cannot be empty or whitespace.")
        return v_stripped


class ProjectUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color_code: str = Field(..., description="Hex color code format #RRGGBB")

    @field_validator("color_code")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Invalid hex color code format. Must be #RRGGBB.")
        return v.upper()

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("Project name cannot be empty or whitespace.")
        return v_stripped


class ProjectResponse(BaseModel):
    id: str
    name: str
    color_code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
