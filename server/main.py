import os
from contextlib import asynccontextmanager
from datetime import date
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from server.database import get_db, init_db
from server.schemas import TimeEntryCreate, TimeEntryResponse, DailySummaryResponse
from server.crud import (
    create_time_entry,
    get_time_entries,
    get_today_time_entries,
    delete_time_entry,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schema
    init_db()
    yield


app = FastAPI(
    title="Chronos Time Tracking API",
    description="API for tracking time entries and daily summaries",
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


@app.get("/health", response_model=dict, status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "healthy"}


@app.post(
    "/api/v1/time-entries",
    response_model=TimeEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_entry(entry_in: TimeEntryCreate, db: Session = Depends(get_db)):
    try:
        db_entry = create_time_entry(db, entry_in)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}",
        )


@app.get(
    "/api/v1/time-entries/today",
    response_model=DailySummaryResponse,
    status_code=status.HTTP_200_OK,
)
def get_today_summary(db: Session = Depends(get_db)):
    try:
        entries = get_today_time_entries(db)
        total_duration = sum(entry.duration_seconds for entry in entries)
        return {"entries": entries, "total_duration_seconds": total_duration}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@app.get(
    "/api/v1/time-entries",
    response_model=List[TimeEntryResponse],
    status_code=status.HTTP_200_OK,
)
def list_entries(
    date_filter: Optional[date] = Query(None, alias="date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return get_time_entries(db, date_filter=date_filter, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@app.delete("/api/v1/time-entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(entry_id: str, db: Session = Depends(get_db)):
    try:
        success = delete_time_entry(db, entry_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
            )
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
