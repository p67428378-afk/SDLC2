import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import Transaction, get_utc_now
from server.services.stripe_service import StripeService
from server.services.audit_service import AuditService

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    payload_bytes = await request.body()

    try:
        event = StripeService.verify_webhook_signature(payload_bytes, stripe_signature)
    except (stripe.error.SignatureVerificationError, ValueError) as e:
        AuditService.log_event(
            db=db,
            event_type="stripe.webhook.signature_verification_failed",
            action="WEBHOOK_REJECTED",
            status_code=401,
            signature_valid=False,
            raw_payload={"error": str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature.",
        )

    event_type = event.get("type", "unknown")
    event_data = event.get("data", {}).get("object", {})
    payment_intent_id = event_data.get("id")

    # Idempotent event processing
    if event_type == "payment_intent.succeeded":
        if payment_intent_id:
            tx = (
                db.query(Transaction)
                .filter(Transaction.payment_intent_id == payment_intent_id)
                .first()
            )
            if tx:
                tx.status = "COMPLETED"
                tx.updated_at = get_utc_now()
                db.commit()

    elif event_type == "payment_intent.payment_failed":
        if payment_intent_id:
            tx = (
                db.query(Transaction)
                .filter(Transaction.payment_intent_id == payment_intent_id)
                .first()
            )
            if tx:
                tx.status = "FAILED"
                tx.updated_at = get_utc_now()
                db.commit()

    elif event_type in ("charge.refunded", "refund.created"):
        if payment_intent_id:
            tx = (
                db.query(Transaction)
                .filter(Transaction.payment_intent_id == payment_intent_id)
                .first()
            )
            if tx and tx.remaining_refundable_balance <= 0.01:
                tx.status = "REFUNDED"
                tx.updated_at = get_utc_now()
                db.commit()

    # Log successful webhook handling
    AuditService.log_event(
        db=db,
        event_type=f"stripe.webhook.{event_type}",
        action="WEBHOOK_PROCESSED",
        transaction_id=None,
        status_code=200,
        signature_valid=True,
        raw_payload={
            "event_id": event.get("id"),
            "event_type": event_type,
            "payment_intent_id": payment_intent_id,
        },
    )

    return {"status": "success", "received": True, "event_type": event_type}
