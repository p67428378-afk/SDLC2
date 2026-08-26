import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import SessionLocal, init_db, seed_data
from server.routers import auth, projects, timesheets


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and idempotent test accounts / projects
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Timesheet Tracking Application API",
    description="Full-stack timesheet management API with JWT auth and RBAC",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware Configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")
origins = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(timesheets.router, prefix="/api/v1/timesheets", tags=["Timesheets"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
