from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models.transaction import Transaction
from server.models.refund import Refund
from server.services.stripe_service import create_stripe_refund
from server.services.audit_service import log_audit_event


def process_refund(
    db: Session,
    transaction_id: str,
    amount: float,
    reason: Optional[str] = None,
    actor_id: str = "system",
    ip_address: Optional[str] = None,
) -> Refund:
    if amount <= 0:
        raise HTTPException(
            status_code=400, detail="Refund amount must be greater than zero"
        )

    # 1. Fetch transaction
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.status not in ("COMPLETED", "AUTHORIZED", "PARTIALLY_REFUNDED"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot refund transaction in status '{transaction.status}'",
        )

    # 2. Check existing refunds
    existing_refunds = (
        db.query(Refund)
        .filter(Refund.transaction_id == transaction.id, Refund.status == "SUCCEEDED")
        .all()
    )
    already_refunded = sum(r.amount for r in existing_refunds)

    remaining_balance = round(transaction.amount - already_refunded, 2)
    if remaining_balance <= 0:
        raise HTTPException(
            status_code=400, detail="Transaction is already fully refunded"
        )

    if round(amount, 2) > remaining_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Refund amount ({amount}) exceeds remaining balance ({remaining_balance})",
        )

    # 3. Stripe refund execution
    payment_intent_id = (
        transaction.stripe_payment_intent_id or f"pi_mock_{transaction.id[:8]}"
    )
    stripe_res = create_stripe_refund(
        payment_intent_id=payment_intent_id,
        amount=amount,
        currency=transaction.currency,
        reason=reason,
    )

    # 4. Create Refund Record
    refund_record = Refund(
        transaction_id=transaction.id,
        stripe_refund_id=stripe_res["id"],
        amount=amount,
        currency=transaction.currency,
        reason=reason,
        status="SUCCEEDED",
    )
    db.add(refund_record)

    # 5. Update transaction status
    new_total_refunded = round(already_refunded + amount, 2)
    if new_total_refunded >= round(transaction.amount, 2):
        transaction.status = "REFUNDED"
    else:
        transaction.status = "PARTIALLY_REFUNDED"

    try:
        db.commit()
        db.refresh(refund_record)
        db.refresh(transaction)
    except Exception:
        db.rollback()
        raise

    # 6. Log PCI Audit Event
    log_audit_event(
        db=db,
        action="REFUND_PROCESSED",
        actor_id=actor_id,
        payload={
            "transaction_id": transaction.id,
            "refund_id": refund_record.id,
            "stripe_refund_id": refund_record.stripe_refund_id,
            "amount": amount,
            "currency": transaction.currency,
            "reason": reason,
            "new_transaction_status": transaction.status,
        },
        transaction_id=transaction.id,
        ip_address=ip_address,
    )

    return refund_record
