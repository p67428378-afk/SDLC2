from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server import schemas, crud

router = APIRouter(prefix="/api/v1/time-entries", tags=["time-entries"])


@router.get("", response_model=List[schemas.TimeEntryResponse])
def list_time_entries(
    target_date: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    return crud.get_time_entries(db, target_date=target_date)


@router.post(
    "", response_model=schemas.TimeEntryResponse, status_code=status.HTTP_201_CREATED
)
def create_time_entry(entry_in: schemas.TimeEntryCreate, db: Session = Depends(get_db)):
    return crud.create_time_entry(db, entry_in)


@router.get("/daily-summary", response_model=schemas.DailySummaryResponse)
def get_daily_summary(
    target_date: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    query_date = target_date or datetime.now(timezone.utc).date()
    return crud.get_daily_summary(db, query_date)
