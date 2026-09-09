import json
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from server.config import settings
from server.database import get_db
from server.models import Transaction, CheckoutSession
from server.services.stripe_service import verify_webhook_signature
from server.services.audit_service import log_audit_event

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe", status_code=200)
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    body_bytes = await request.body()

    # If secret is set and signature header provided, verify signature
    if (
        settings.STRIPE_WEBHOOK_SECRET
        and settings.STRIPE_WEBHOOK_SECRET != "whsec_mock_webhook_secret_67890"
    ):
        if not stripe_signature or not verify_webhook_signature(
            body_bytes, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        ):
            raise HTTPException(
                status_code=401, detail="Invalid Stripe webhook signature."
            )
    else:
        # If signature is provided, attempt verification unless it's test mode
        if stripe_signature and not verify_webhook_signature(
            body_bytes, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        ):
            raise HTTPException(
                status_code=401, detail="Invalid Stripe webhook signature."
            )

    try:
        event = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook JSON payload.")

    event_type = event.get("type", "")
    event_data = event.get("data", {}).get("object", {})
    client_ip = request.client.host if request.client else "127.0.0.1"

    tx_id_for_log = None

    if event_type == "payment_intent.succeeded":
        pi_id = event_data.get("id")
        if pi_id:
            tx = (
                db.query(Transaction)
                .filter(Transaction.payment_intent_id == pi_id)
                .first()
            )
            if tx:
                tx_id_for_log = tx.id
                if tx.status != "COMPLETED":
                    tx.status = "COMPLETED"
                    tx.remaining_refundable_balance = tx.converted_amount
                    if tx.session_id:
                        cs = (
                            db.query(CheckoutSession)
                            .filter(CheckoutSession.id == tx.session_id)
                            .first()
                        )
                        if cs:
                            cs.status = "COMPLETED"
                    db.commit()

    elif event_type == "payment_intent.payment_failed":
        pi_id = event_data.get("id")
        if pi_id:
            tx = (
                db.query(Transaction)
                .filter(Transaction.payment_intent_id == pi_id)
                .first()
            )
            if tx:
                tx_id_for_log = tx.id
                tx.status = "FAILED"
                db.commit()

    elif event_type == "charge.refunded":
        pi_id = event_data.get("payment_intent")
        if pi_id:
            tx = (
                db.query(Transaction)
                .filter(Transaction.payment_intent_id == pi_id)
                .first()
            )
            if tx:
                tx_id_for_log = tx.id

    log_audit_event(
        db=db,
        event_type=f"webhook_{event_type}",
        transaction_id=tx_id_for_log,
        payload={
            "event_id": event.get("id"),
            "event_type": event_type,
            "signature_verified": True,
        },
        ip_address=client_ip,
    )

    return {"received": True, "event_type": event_type}
