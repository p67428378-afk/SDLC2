import json
from server.config import settings
from server.models.transaction import Transaction
from server.services.stripe_service import generate_webhook_signature


def test_webhook_payment_intent_succeeded(client, db_session):
    # Setup pending transaction
    tx = Transaction(
        id="tx_webhook_pi_1",
        amount=89.0,
        currency="USD",
        status="PENDING",
        payment_method_type="CREDIT_CARD",
        stripe_payment_intent_id="pi_webhook_success_999",
        customer_id="cust_wh",
    )
    db_session.add(tx)
    db_session.commit()

    event_payload = {
        "id": "evt_test_pi_succeeded_001",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_webhook_success_999",
                "amount": 8900,
                "currency": "usd",
                "status": "succeeded",
            }
        },
    }
    payload_bytes = json.dumps(event_payload).encode("utf-8")
    sig = generate_webhook_signature(payload_bytes, settings.STRIPE_WEBHOOK_SECRET)

    res = client.post(
        "/api/v1/webhooks/stripe",
        content=payload_bytes,
        headers={"Stripe-Signature": sig},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["received"] is True
    assert data["event_id"] == "evt_test_pi_succeeded_001"
    assert data["status"] == "processed"

    # Verify transaction status was updated
    tx_check = client.get("/api/v1/payments/transactions/tx_webhook_pi_1").json()
    assert tx_check["status"] == "COMPLETED"


def test_webhook_idempotency(client, db_session):
    event_payload = {
        "id": "evt_test_idempotency_002",
        "type": "payment_intent.succeeded",
        "data": {"object": {"id": "pi_not_found_123", "status": "succeeded"}},
    }
    payload_bytes = json.dumps(event_payload).encode("utf-8")
    sig = generate_webhook_signature(payload_bytes, settings.STRIPE_WEBHOOK_SECRET)

    # First call
    res1 = client.post(
        "/api/v1/webhooks/stripe",
        content=payload_bytes,
        headers={"Stripe-Signature": sig},
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "processed"

    # Duplicate call -> should be skipped idempotently
    res2 = client.post(
        "/api/v1/webhooks/stripe",
        content=payload_bytes,
        headers={"Stripe-Signature": sig},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "already_processed"


def test_webhook_invalid_signature(client):
    event_payload = {"id": "evt_invalid_sig", "type": "payment_intent.succeeded"}
    payload_bytes = json.dumps(event_payload).encode("utf-8")

    res = client.post(
        "/api/v1/webhooks/stripe",
        content=payload_bytes,
        headers={"Stripe-Signature": "t=123456,v1=invalid_signature_hash"},
    )
    assert res.status_code == 401
    assert "Invalid Stripe webhook signature" in res.json()["detail"]


def test_webhook_missing_signature(client):
    event_payload = {"id": "evt_no_sig", "type": "payment_intent.succeeded"}
    payload_bytes = json.dumps(event_payload).encode("utf-8")

    res = client.post("/api/v1/webhooks/stripe", content=payload_bytes)
    assert res.status_code == 401
