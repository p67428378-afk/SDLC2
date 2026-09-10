import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data, SessionLocal
from server.api.v1.endpoints.metrics import router as metrics_router
from server.api.v1.endpoints.skus import router as skus_router
from server.api.v1.endpoints.scenarios import router as scenarios_router
from server.api.v1.endpoints.guardrails import router as guardrails_router
from server.api.v1.endpoints.submissions import router as submissions_router
from server.api.v1.endpoints.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize schema & seed DB
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="DG Cluster Assortment Advisor API",
    version="1.0.0",
    description="Decision-support API for Dollar General category managers in Small Town Value Cluster stores",
    lifespan=lifespan,
)

# CORS Middleware
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "app": "DG Cluster Assortment Advisor"}


# Mount API v1 Routers
app.include_router(metrics_router, prefix="/api/v1")
app.include_router(skus_router, prefix="/api/v1")
app.include_router(scenarios_router, prefix="/api/v1")
app.include_router(guardrails_router, prefix="/api/v1")
app.include_router(submissions_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
