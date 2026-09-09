from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.api.v1.payments import router as payments_router
from server.api.v1.refunds import router as refunds_router
from server.api.v1.webhooks import router as webhooks_router
from server.api.v1.audit import router as audit_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# CORS Middleware for full-stack React / Vite / Tailwind client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(refunds_router, prefix=settings.API_V1_STR)
app.include_router(webhooks_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
