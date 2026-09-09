from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.api.v1 import api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables and seed test accounts/rates
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    # Shutdown


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="PCI-Compliant Payment Gateway Service supporting Stripe, Digital Wallets, Multi-Currency, Refunds & Webhooks",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware (Mandatory for Fullstack support)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(api_v1_router)


@app.get("/health", tags=["health"])
@app.get("/api/v1/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": "1.0.0"}
