from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import SubmissionAudit
from server.schemas import SubmissionRequest, SubmissionResponse, AuditRecordResponse
from server.services.assortment_service import submit_assortment_plan

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(
    payload: SubmissionRequest,
    db: Session = Depends(get_db),
):
    return submit_assortment_plan(db=db, payload=payload)


@router.get("", response_model=List[AuditRecordResponse])
def list_submissions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    records = (
        db.query(SubmissionAudit)
        .order_by(SubmissionAudit.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [AuditRecordResponse.model_validate(r) for r in records]


@router.get("/{audit_id}", response_model=AuditRecordResponse)
def get_submission_by_audit_id(
    audit_id: str,
    db: Session = Depends(get_db),
):
    record = db.query(SubmissionAudit).filter(SubmissionAudit.audit_id == audit_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Audit record '{audit_id}' not found.")
    return AuditRecordResponse.model_validate(record)
