import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager

from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.routers import auth, dashboard, accounts, mocks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="ApexUnion API",
    description="Unified Banking & Mortgage Dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", settings.ALLOWED_ORIGINS).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session Middleware for storing mock scenario in session state
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("JWT_SECRET_KEY", settings.JWT_SECRET_KEY),
)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(accounts.router)
app.include_router(mocks.router)


@app.get("/", response_model=dict)
def health_check():
    return {"status": "healthy", "service": "ApexUnion API"}
