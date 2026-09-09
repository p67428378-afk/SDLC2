from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.database import get_db, seed_data
from server.models import AuditLog, get_utc_now
from server.schemas import AuditLogEntry

router = APIRouter(tags=["audit"])


@router.get("/audit-logs", response_model=List[AuditLogEntry])
@router.get("/audit", response_model=List[AuditLogEntry])
def list_audit_logs(
    transaction_id: Optional[str] = None,
    event_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    if db.query(AuditLog).count() == 0:
        seed_data(db)

    query = db.query(AuditLog)
    if transaction_id:
        query = query.filter(AuditLog.transaction_id == transaction_id)
    if event_type:
        query = query.filter(AuditLog.event_type.ilike(f"%{event_type}%"))

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return [
        AuditLogEntry(
            id=str(log.id),
            transaction_id=str(log.transaction_id) if log.transaction_id else None,
            event_type=str(log.event_type),
            action=str(log.action) if log.action else None,
            ip_address=str(log.ip_address) if log.ip_address else None,
            user_id=str(log.user_id) if log.user_id else None,
            status_code=int(log.status_code) if log.status_code is not None else 200,
            signature_valid=bool(log.signature_valid)
            if log.signature_valid is not None
            else True,
            masked_payload=dict(log.masked_payload)
            if isinstance(log.masked_payload, dict)
            else (log.masked_payload if log.masked_payload else None),
            created_at=log.created_at.isoformat()
            if log.created_at
            else get_utc_now().isoformat(),
        )
        for log in logs
    ]
