import os
from contextlib import asynccontextmanager
from datetime import date
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from server.database import get_db, init_db
from server.schemas import (
    TimeEntryCreate,
    TimeEntryResponse,
    DailySummaryResponse,
    UserResponse,
    UserPreferenceResponse,
    UserPreferenceUpdate,
    # New schemas
    TimerStartRequest,
    TimerStartResponse,
    TimerStopRequest,
    TimerStopResponse,
    ManualEntryRequest,
    ManualEntryResponse,
    DailySummaryNewResponse,
    UserPreferenceNewResponse,
    UserPreferenceNewUpdate,
)
from server.crud import (
    create_time_entry,
    get_time_entries,
    get_today_time_entries,
    delete_time_entry,
    get_or_create_default_user,
    update_user_preferences,
    # New CRUD functions
    start_timer_new,
    stop_timer_new,
    create_manual_entry_new,
    get_daily_summary_new,
    update_user_preferences_new,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schema
    init_db()
    # Seed default user
    from server.database import SessionLocal

    db = SessionLocal()
    try:
        get_or_create_default_user(db)
    finally:
        db.close()
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


# Mock Authentication Dependency
def get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
):
    if authorization == "Bearer unauthorized":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    return get_or_create_default_user(db)


@app.get("/health", response_model=dict, status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "healthy"}


# --- NEW WORKSPEC ENDPOINTS ---


@app.post(
    "/api/v1/time-entries/start",
    response_model=TimerStartResponse,
    status_code=status.HTTP_200_OK,
)
def start_timer_endpoint(
    req: Optional[TimerStartRequest] = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        desc = req.description if req else None
        db_entry = start_timer_new(db, current_user.id, desc)
        return {
            "start_time": db_entry.start_time,
            "status": "RUNNING",
            "timer_id": db_entry.id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start timer: {str(e)}",
        )


@app.post(
    "/api/v1/time-entries/stop",
    response_model=TimerStopResponse,
    status_code=status.HTTP_200_OK,
)
def stop_timer_endpoint(
    req: TimerStopRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        db_entry = stop_timer_new(db, current_user.id, req.timer_id)
        return {
            "elapsed_seconds": db_entry.duration_seconds,
            "status": "STOPPED",
            "timer_id": db_entry.id,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop timer: {str(e)}",
        )


@app.post(
    "/api/v1/time-entries/manual",
    response_model=ManualEntryResponse,
    status_code=status.HTTP_200_OK,
)
def create_manual_entry_endpoint(
    req: ManualEntryRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        db_entry = create_manual_entry_new(
            db, current_user.id, req.description, req.duration_minutes, req.entry_date
        )
        return {
            "description": db_entry.description,
            "duration_minutes": db_entry.duration_minutes,
            "entry_id": db_entry.id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create manual entry: {str(e)}",
        )


@app.get(
    "/api/v1/time-entries/daily-summary",
    response_model=DailySummaryNewResponse,
    status_code=status.HTTP_200_OK,
)
def get_daily_summary_endpoint(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        summary = get_daily_summary_new(db, current_user.id)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch daily summary: {str(e)}",
        )


@app.put(
    "/api/v1/users/me/preferences",
    response_model=UserPreferenceNewResponse,
    status_code=status.HTTP_200_OK,
)
def update_preferences_put(
    req: UserPreferenceNewUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        pref = update_user_preferences_new(db, current_user.id, req.dark_mode)
        return {
            "dark_mode": pref.dark_mode,
            "updated_at": pref.updated_at,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update preferences: {str(e)}",
        )


# --- OLD ENDPOINTS (FOR BACKWARD COMPATIBILITY) ---


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


# User Preferences Endpoints
@app.get(
    "/api/v1/users/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@app.patch(
    "/api/v1/users/me/preferences",
    response_model=UserPreferenceResponse,
    status_code=status.HTTP_200_OK,
)
def update_preferences(
    pref_in: UserPreferenceUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        pref = update_user_preferences(db, current_user.id, pref_in.dark_mode)
        return pref
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update preferences: {str(e)}",
        )
