from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    JWT_SECRET_KEY: str = "dev-secret-change-in-production"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    TESTING: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
