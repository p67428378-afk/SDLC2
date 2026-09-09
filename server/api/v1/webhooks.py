import json
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from server.config import settings
from server.database import get_db
from server.models.transaction import Transaction
from server.models.audit_log import AuditLog
from server.schemas.webhook import WebhookResponse
from server.services.stripe_service import verify_webhook_signature
from server.services.audit_service import log_audit_event

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post(
    "/stripe",
    response_model=WebhookResponse,
    status_code=status.HTTP_200_OK,
    summary="Stripe Asynchronous Webhook Handler",
)
async def handle_stripe_webhook(request: Request, db: Session = Depends(get_db)):
    sig_header = request.headers.get("stripe-signature") or request.headers.get(
        "Stripe-Signature"
    )
    payload_bytes = await request.body()

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Stripe-Signature header",
        )

    # 1. Verify HMAC Signature
    is_valid = verify_webhook_signature(
        payload_bytes=payload_bytes,
        sig_header=sig_header,
        secret=settings.STRIPE_WEBHOOK_SECRET,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Stripe webhook signature",
        )

    # 2. Parse Event JSON
    try:
        event = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON payload")

    event_id = event.get("id", "evt_unknown")
    event_type = event.get("type", "unknown")
    data_object = event.get("data", {}).get("object", {})

    # 3. Idempotency Check
    existing_log = (
        db.query(AuditLog)
        .filter(AuditLog.action == f"WEBHOOK_PROCESSED_{event_id}")
        .first()
    )

    if existing_log:
        return WebhookResponse(
            received=True,
            event_id=event_id,
            status="already_processed",
            detail="Duplicate webhook delivery skipped idempotently",
        )

    # 4. Process Event Lifecycle
    client_ip = request.client.host if request.client else None
    target_tx = None

    if event_type == "payment_intent.succeeded":
        pi_id = data_object.get("id")
        if pi_id:
            target_tx = (
                db.query(Transaction)
                .filter(Transaction.stripe_payment_intent_id == pi_id)
                .first()
            )
            if target_tx:
                target_tx.status = "COMPLETED"
                db.commit()

    elif event_type == "payment_intent.payment_failed":
        pi_id = data_object.get("id")
        if pi_id:
            target_tx = (
                db.query(Transaction)
                .filter(Transaction.stripe_payment_intent_id == pi_id)
                .first()
            )
            if target_tx:
                target_tx.status = "FAILED"
                db.commit()

    elif event_type in ("charge.refunded", "charge.refund.updated"):
        pi_id = data_object.get("payment_intent")
        if pi_id:
            target_tx = (
                db.query(Transaction)
                .filter(Transaction.stripe_payment_intent_id == pi_id)
                .first()
            )
            if target_tx:
                amount_refunded = data_object.get("amount_refunded", 0) / 100.0
                if amount_refunded >= target_tx.amount:
                    target_tx.status = "REFUNDED"
                else:
                    target_tx.status = "PARTIALLY_REFUNDED"
                db.commit()

    # 5. Log Idempotency Token and Event Audit
    log_audit_event(
        db=db,
        action=f"WEBHOOK_PROCESSED_{event_id}",
        actor_id="stripe_webhook",
        payload={
            "event_id": event_id,
            "event_type": event_type,
            "object_id": data_object.get("id"),
            "data": data_object,
        },
        transaction_id=target_tx.id if target_tx else None,
        ip_address=client_ip,
    )

    return WebhookResponse(
        received=True,
        event_id=event_id,
        status="processed",
        detail=f"Processed {event_type} successfully",
    )
