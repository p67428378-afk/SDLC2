import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db, seed_data
from server.models import Transaction, Refund, get_utc_now
from server.schemas import RefundRequest, RefundSummary
from server.services.stripe_service import StripeService
from server.services.audit_service import AuditService

router = APIRouter(prefix="/refunds", tags=["refunds"])


@router.post("", response_model=RefundSummary, status_code=status.HTTP_201_CREATED)
def process_refund(req: RefundRequest, db: Session = Depends(get_db)):
    if db.query(Transaction).count() == 0:
        seed_data(db)

    tx = db.query(Transaction).filter(Transaction.id == req.transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction '{req.transaction_id}' not found or invalid.",
        )

    remaining_balance = (
        float(tx.remaining_refundable_balance)
        if tx.remaining_refundable_balance is not None
        else (float(tx.amount) - float(tx.refunded_amount or 0.0))
    )

    if tx.status == "REFUNDED" or remaining_balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction is already fully refunded.",
        )

    if req.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refund amount must be greater than zero.",
        )

    if req.amount > remaining_balance + 0.001:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Refund amount ({req.amount}) cannot exceed remaining balance ({remaining_balance:.2f}).",
        )

    payment_intent_id = (
        str(tx.payment_intent_id) if tx.payment_intent_id else f"pi_{tx.id}"
    )
    StripeService.create_refund(
        payment_intent_id=payment_intent_id,
        amount=req.amount,
        currency=str(tx.currency),
        reason=req.reason,
    )

    ref_id = f"ref_{uuid.uuid4().hex[:12]}"
    new_refunded_amount = round(float(tx.refunded_amount or 0.0) + req.amount, 2)
    new_remaining_balance = round(max(0.0, float(tx.amount) - new_refunded_amount), 2)

    tx.refunded_amount = new_refunded_amount
    tx.remaining_refundable_balance = new_remaining_balance
    if new_remaining_balance <= 0.01:
        tx.status = "REFUNDED"
    else:
        tx.status = "PARTIALLY_REFUNDED"

    refund_record = Refund(
        id=ref_id,
        transaction_id=str(tx.id),
        refund_amount=req.amount,
        currency=str(tx.currency),
        reason=req.reason,
        memo=req.memo,
        status="SUCCEEDED",
        created_at=get_utc_now(),
    )
    db.add(refund_record)
    db.commit()

    AuditService.log_event(
        db=db,
        event_type="refund.created",
        action="PARTIAL_REFUND" if tx.status == "PARTIALLY_REFUNDED" else "FULL_REFUND",
        transaction_id=str(tx.id),
        status_code=201,
        raw_payload={
            "refund_id": ref_id,
            "transaction_id": str(tx.id),
            "refund_amount": req.amount,
            "currency": str(tx.currency),
            "reason": req.reason,
            "new_status": tx.status,
        },
    )

    return RefundSummary(
        id=ref_id,
        transaction_id=str(tx.id),
        refund_amount=req.amount,
        currency=str(tx.currency),
        reason=req.reason,
        status="SUCCEEDED",
        created_at=refund_record.created_at.isoformat()
        if refund_record.created_at
        else get_utc_now().isoformat(),
    )


@router.get("", response_model=List[RefundSummary])
def list_refunds(
    transaction_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    if db.query(Refund).count() == 0:
        seed_data(db)

    query = db.query(Refund)
    if transaction_id:
        query = query.filter(Refund.transaction_id == transaction_id)

    refunds = query.order_by(Refund.created_at.desc()).offset(skip).limit(limit).all()

    return [
        RefundSummary(
            id=str(r.id),
            transaction_id=str(r.transaction_id),
            refund_amount=float(r.refund_amount),
            currency=str(r.currency),
            reason=str(r.reason),
            status=str(r.status),
            created_at=r.created_at.isoformat()
            if r.created_at
            else get_utc_now().isoformat(),
        )
        for r in refunds
    ]
