from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.audit_log import AuditLog
from server.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get(
    "",
    response_model=List[AuditLogResponse],
    status_code=status.HTTP_200_OK,
    summary="List PCI-Compliant Audit Logs",
)
def list_audit_logs(
    skip: int = 0,
    limit: int = 50,
    transaction_id: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if transaction_id:
        query = query.filter(AuditLog.transaction_id == transaction_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    return [
        AuditLogResponse(
            id=log.id,
            transaction_id=log.transaction_id,
            action=log.action,
            actor_id=log.actor_id,
            masked_payload=log.masked_payload
            if isinstance(log.masked_payload, dict)
            else {"raw": str(log.masked_payload)},
            ip_address=log.ip_address,
            timestamp=log.timestamp,
        )
        for log in logs
    ]


@router.get(
    "/{log_id}",
    response_model=AuditLogResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Specific Audit Log Entry",
)
def get_audit_log(log_id: str, db: Session = Depends(get_db)):
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")

    return AuditLogResponse(
        id=log.id,
        transaction_id=log.transaction_id,
        action=log.action,
        actor_id=log.actor_id,
        masked_payload=log.masked_payload
        if isinstance(log.masked_payload, dict)
        else {"raw": str(log.masked_payload)},
        ip_address=log.ip_address,
        timestamp=log.timestamp,
    )
