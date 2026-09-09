def test_apple_pay_payment_success(client):
    # 1. Create a session first
    session_res = client.post(
        "/api/v1/payments/checkout-session",
        json={
            "amount": 75.50,
            "currency": "USD",
            "customer_id": "cust_apple_user",
            "description": "Apple Pay Test",
        },
    )
    assert session_res.status_code == 201
    session_id = session_res.json()["session_id"]

    # 2. Submit Apple Pay token
    wallet_payload = {
        "session_id": session_id,
        "wallet_provider": "APPLE_PAY",
        "token": {
            "paymentData": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
            "paymentMethod": {
                "displayName": "Visa 1111",
                "network": "Visa",
                "type": "debit",
            },
        },
    }
    res = client.post("/api/v1/payments/digital-wallet", json=wallet_payload)
    assert res.status_code == 200
    data = res.json()
    assert "transaction_id" in data
    assert data["status"] == "AUTHORIZED"
    assert data["wallet_provider"] == "APPLE_PAY"
    assert "Visa 1111" in data["masked_account"]


def test_google_pay_payment_success(client):
    session_res = client.post(
        "/api/v1/payments/checkout-session",
        json={"amount": 35.00, "currency": "USD", "customer_id": "cust_gpay_user"},
    )
    session_id = session_res.json()["session_id"]

    wallet_payload = {
        "session_id": session_id,
        "wallet_provider": "GOOGLE_PAY",
        "token": {"description": "Mastercard •••• 4444", "cardDetails": "4444"},
    }
    res = client.post("/api/v1/payments/digital-wallet", json=wallet_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "AUTHORIZED"
    assert data["wallet_provider"] == "GOOGLE_PAY"


def test_wallet_non_existent_session(client):
    wallet_payload = {
        "session_id": "non-existent-session-id",
        "wallet_provider": "APPLE_PAY",
        "token": {"paymentData": "valid_token"},
    }
    res = client.post("/api/v1/payments/digital-wallet", json=wallet_payload)
    assert res.status_code == 404


def test_wallet_rejected_token(client):
    session_res = client.post(
        "/api/v1/payments/checkout-session",
        json={"amount": 25.00, "currency": "USD", "customer_id": "cust_fail"},
    )
    session_id = session_res.json()["session_id"]

    wallet_payload = {
        "session_id": session_id,
        "wallet_provider": "APPLE_PAY",
        "token": {"status": "rejected", "error": "insufficient_funds"},
    }
    res = client.post("/api/v1/payments/digital-wallet", json=wallet_payload)
    assert res.status_code == 422


def test_wallet_invalid_provider(client):
    session_res = client.post(
        "/api/v1/payments/checkout-session",
        json={"amount": 25.00, "currency": "USD", "customer_id": "cust_fail"},
    )
    session_id = session_res.json()["session_id"]

    wallet_payload = {
        "session_id": session_id,
        "wallet_provider": "UNKNOWN_PAY",
        "token": {"paymentData": "some_data"},
    }
    res = client.post("/api/v1/payments/digital-wallet", json=wallet_payload)
    assert res.status_code == 422
