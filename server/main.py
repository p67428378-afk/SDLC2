from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from server.database import init_db, seed_data, SessionLocal
from server.routers import auth_router, payment_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schema
    init_db()

    # Seed initial data
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="Apex Bank Mortgage Payment API",
    description="API for managing mortgage payments from online banking",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
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

# Include Routers
app.include_router(auth_router)
app.include_router(payment_router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}
