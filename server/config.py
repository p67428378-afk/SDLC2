import os
from typing import Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/test.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MFA_TOKEN_EXPIRE_MINUTES: int = 5
    MFA_CODE_TTL_SECONDS: int = int(os.getenv("MFA_CODE_TTL_SECONDS", "300"))
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    )

    FISERV_MODE: str = os.getenv("FISERV_MODE", "mock")
    FISERV_API_KEY: Optional[str] = os.getenv("FISERV_API_KEY")
    FISERV_API_SECRET: Optional[str] = os.getenv("FISERV_API_SECRET")
    FISERV_TOKEN_URL: Optional[str] = os.getenv("FISERV_TOKEN_URL")
    FISERV_BASE_URL: Optional[str] = os.getenv("FISERV_BASE_URL")
    FISERV_ORG_ID: Optional[str] = os.getenv("FISERV_ORG_ID")
    FISERV_DEMO_ACCOUNTS: Optional[str] = os.getenv("FISERV_DEMO_ACCOUNTS")

    @model_validator(mode="after")
    def validate_fiserv_settings(self) -> "Settings":
        if self.FISERV_MODE == "live":
            missing = []
            if not self.FISERV_API_KEY:
                missing.append("FISERV_API_KEY")
            if not self.FISERV_API_SECRET:
                missing.append("FISERV_API_SECRET")
            if not self.FISERV_TOKEN_URL:
                missing.append("FISERV_TOKEN_URL")
            if not self.FISERV_BASE_URL:
                missing.append("FISERV_BASE_URL")
            if not self.FISERV_ORG_ID:
                missing.append("FISERV_ORG_ID")
            if not self.FISERV_DEMO_ACCOUNTS:
                missing.append("FISERV_DEMO_ACCOUNTS")
            if missing:
                raise ValueError(
                    f"Missing required Fiserv environment variables for live mode: {', '.join(missing)}"
                )
        return self

    class Config:
        env_file = ".env"


settings = Settings()
