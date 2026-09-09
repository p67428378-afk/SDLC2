from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models import Transaction, Refund
from server.schemas import RefundRequest, RefundSummary
from server.services.stripe_service import process_stripe_refund
from server.services.audit_service import log_audit_event

router = APIRouter(prefix="/refunds", tags=["refunds"])


@router.post("", response_model=RefundSummary, status_code=201)
def create_refund(
    payload: RefundRequest, request: Request, db: Session = Depends(get_db)
):
    tx = (
        db.query(Transaction)
        .filter(
            or_(
                Transaction.id == payload.transaction_id,
                Transaction.payment_intent_id == payload.transaction_id,
            )
        )
        .first()
    )

    if not tx:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transaction ID '{payload.transaction_id}'.",
        )

    if tx.status in ["FAILED", "PENDING"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot refund a transaction with status '{tx.status}'.",
        )

    if tx.remaining_refundable_balance <= 0:
        raise HTTPException(
            status_code=400, detail="Transaction is already fully refunded."
        )

    if payload.amount > round(tx.remaining_refundable_balance, 2):
        raise HTTPException(
            status_code=400,
            detail=f"Refund amount ({payload.amount}) cannot exceed remaining balance ({tx.remaining_refundable_balance}).",
        )

    # Process Stripe refund simulation
    stripe_refund = process_stripe_refund(
        payment_intent_id=tx.payment_intent_id,
        amount=payload.amount,
        reason=payload.reason,
    )

    # Update transaction balances
    tx.refunded_amount = round(tx.refunded_amount + payload.amount, 2)
    tx.remaining_refundable_balance = round(
        tx.remaining_refundable_balance - payload.amount, 2
    )

    if tx.remaining_refundable_balance <= 0.001:
        tx.status = "REFUNDED"
        tx.remaining_refundable_balance = 0.0
    else:
        tx.status = "PARTIALLY_REFUNDED"

    refund_record = Refund(
        id=stripe_refund["id"],
        transaction_id=tx.id,
        refund_amount=payload.amount,
        currency=tx.target_currency,
        status="SUCCEEDED",
        reason=payload.reason,
        memo=payload.memo,
    )
    db.add(refund_record)
    db.commit()
    db.refresh(refund_record)
    db.refresh(tx)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        event_type="refund_processed",
        transaction_id=tx.id,
        payload={
            "refund_id": refund_record.id,
            "transaction_id": tx.id,
            "refund_amount": payload.amount,
            "remaining_balance": tx.remaining_refundable_balance,
            "reason": payload.reason,
            "memo": payload.memo,
        },
        ip_address=client_ip,
    )

    return RefundSummary(
        id=refund_record.id,
        transaction_id=tx.id,
        refund_amount=refund_record.refund_amount,
        currency=refund_record.currency,
        status=refund_record.status,
        reason=refund_record.reason,
        created_at=refund_record.created_at,
    )


@router.get("", response_model=List[RefundSummary])
def list_refunds(
    transaction_id: Optional[str] = Query(None, description="Filter by transaction ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Refund)
    if transaction_id:
        query = query.filter(Refund.transaction_id == transaction_id)
    refunds = query.order_by(Refund.created_at.desc()).offset(skip).limit(limit).all()

    return [
        RefundSummary(
            id=ref.id,
            transaction_id=ref.transaction_id,
            refund_amount=ref.refund_amount,
            currency=ref.currency,
            status=ref.status,
            reason=ref.reason,
            created_at=ref.created_at,
        )
        for ref in refunds
    ]
