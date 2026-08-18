import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data, SessionLocal
from server.routers.projects import router as projects_router
from server.routers.time_entries import router as time_entries_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Seed default data
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="TimeTracker Pro API",
    description="API for Project Management, Tagging, and Daily Summaries",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Middleware setup
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(time_entries_router)

@app.get("/")
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "TimeTracker Pro API"}
