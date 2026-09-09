from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import AuditLog
from server.schemas import AuditLogEntry

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=List[AuditLogEntry])
def list_audit_logs(
    transaction_id: Optional[str] = Query(None, description="Filter by transaction ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if transaction_id:
        query = query.filter(AuditLog.transaction_id == transaction_id)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return [
        AuditLogEntry(
            id=log.id,
            transaction_id=log.transaction_id,
            event_type=log.event_type,
            masked_payload=log.masked_payload,
            ip_address=log.ip_address,
            created_at=log.created_at,
        )
        for log in logs
    ]
