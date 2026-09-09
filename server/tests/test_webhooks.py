from fastapi.testclient import TestClient


def test_stripe_webhook_payment_succeeded(client: TestClient):
    payload = {
        "id": "evt_test_webhook_001",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_1005_mock_intent",  # tx_1005 is PENDING
                "amount": 32000,
                "currency": "usd",
                "status": "succeeded",
            }
        },
    }
    headers = {"stripe-signature": "test_valid_signature"}
    response = client.post("/api/v1/webhooks/stripe", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["received"] is True

    # Verify tx_1005 status transitioned to COMPLETED
    tx_resp = client.get("/api/v1/payments/transactions/tx_1005")
    assert tx_resp.status_code == 200
    assert tx_resp.json()["status"] == "COMPLETED"


def test_stripe_webhook_payment_failed(client: TestClient):
    payload = {
        "id": "evt_test_webhook_002",
        "type": "payment_intent.payment_failed",
        "data": {
            "object": {
                "id": "pi_1001_mock_intent",
                "amount": 14999,
                "currency": "usd",
                "status": "payment_failed",
            }
        },
    }
    headers = {"stripe-signature": "test_valid_signature"}
    response = client.post("/api/v1/webhooks/stripe", json=payload, headers=headers)
    assert response.status_code == 200

    tx_resp = client.get("/api/v1/payments/transactions/tx_1001")
    assert tx_resp.status_code == 200
    assert tx_resp.json()["status"] == "FAILED"


def test_stripe_webhook_invalid_signature(client: TestClient):
    payload = {
        "id": "evt_test_webhook_invalid",
        "type": "payment_intent.succeeded",
        "data": {"object": {"id": "pi_random"}},
    }
    headers = {"stripe-signature": "invalid_sig"}
    # Temporarily force TESTING=False in config for strict sig check if needed or test invalid
    from server.config import settings

    prev = settings.TESTING
    settings.TESTING = False
    try:
        response = client.post("/api/v1/webhooks/stripe", json=payload, headers=headers)
        assert response.status_code == 401
    finally:
        settings.TESTING = prev
