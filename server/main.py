import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db
from server.api.v1 import payments, refunds, webhooks, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema & seed data
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="PCI-compliant Payment Gateway Service backend with Stripe, Digital Wallets, and Multi-Currency support.",
    lifespan=lifespan,
)

# CORS Middleware (MANDATORY for fullstack projects)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
app.include_router(payments.router, prefix="/api/v1")
app.include_router(refunds.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
