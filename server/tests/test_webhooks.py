import json
import time
from server.services.stripe_service import compute_webhook_signature
from server.config import settings


def test_webhook_payment_intent_succeeded(client):
    # Initiate checkout session to create a PENDING transaction
    init_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 80.00,
            "currency": "USD",
            "customer_email": "webhook.buyer@example.com",
        },
    )
    assert init_res.status_code == 200
    pi_id = init_res.json()["payment_intent_id"]

    # Trigger payment_intent.succeeded webhook
    payload_dict = {
        "id": "evt_test_12345",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": pi_id,
                "amount": 8000,
                "currency": "usd",
                "status": "succeeded",
            }
        },
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    timestamp = int(time.time())
    sig_header = compute_webhook_signature(
        payload_bytes, settings.STRIPE_WEBHOOK_SECRET, timestamp
    )

    res = client.post(
        "/api/v1/webhooks/stripe",
        content=payload_bytes,
        headers={"Stripe-Signature": sig_header, "Content-Type": "application/json"},
    )
    assert res.status_code == 200
    assert res.json()["received"] is True

    # Check that transaction status transitioned to COMPLETED
    tx_detail = client.get(f"/api/v1/payments/transactions/{pi_id}").json()
    assert tx_detail["status"] == "COMPLETED"


def test_webhook_payment_intent_failed(client):
    init_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 40.00,
            "currency": "USD",
            "customer_email": "fail.buyer@example.com",
        },
    )
    assert init_res.status_code == 200
    pi_id = init_res.json()["payment_intent_id"]

    payload_dict = {
        "id": "evt_test_fail_67890",
        "type": "payment_intent.payment_failed",
        "data": {
            "object": {
                "id": pi_id,
                "amount": 4000,
                "currency": "usd",
                "status": "failed",
            }
        },
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    timestamp = int(time.time())
    sig_header = compute_webhook_signature(
        payload_bytes, settings.STRIPE_WEBHOOK_SECRET, timestamp
    )

    res = client.post(
        "/api/v1/webhooks/stripe",
        content=payload_bytes,
        headers={"Stripe-Signature": sig_header, "Content-Type": "application/json"},
    )
    assert res.status_code == 200

    tx_detail = client.get(f"/api/v1/payments/transactions/{pi_id}").json()
    assert tx_detail["status"] == "FAILED"


def test_webhook_invalid_signature(client):
    payload_bytes = b'{"id": "evt_test", "type": "payment_intent.succeeded"}'
    res = client.post(
        "/api/v1/webhooks/stripe",
        content=payload_bytes,
        headers={
            "Stripe-Signature": "t=12345,v1=bad_signature",
            "Content-Type": "application/json",
        },
    )
    assert res.status_code == 401
