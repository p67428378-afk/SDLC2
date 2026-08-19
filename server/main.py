import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data, SessionLocal
from server.routers.projects import router as projects_router
from server.routers.time_entries import router as time_entries_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed initial data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Time Tracker API",
    description="Backend API for SCRUM-58 Project Tagging & Daily Summary",
    version="1.0.0",
    lifespan=lifespan,
)

# Mandatory CORS middleware for fullstack compatibility
allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [
    origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(projects_router)
app.include_router(time_entries_router)


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
