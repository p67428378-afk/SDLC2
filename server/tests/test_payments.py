def test_create_checkout_session(client):
    payload = {
        "amount": 49.99,
        "currency": "USD",
        "customer_email": "customer@example.com",
        "items": [
            {"name": "Standard Subscription", "quantity": 1, "unit_price": 49.99}
        ],
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "payment_intent_id" in data
    assert "client_secret" in data
    assert data["base_amount"] == 49.99
    assert data["base_currency"] == "USD"
    assert data["target_amount"] == 49.99
    assert data["target_currency"] == "USD"
    assert data["exchange_rate"] == 1.0


def test_create_checkout_session_multi_currency(client):
    payload = {
        "amount": 100.00,
        "currency": "EUR",
        "customer_email": "euro.buyer@example.com",
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_currency"] == "EUR"
    assert data["exchange_rate"] == 0.9250
    assert data["target_amount"] == 92.50


def test_create_checkout_session_invalid_currency(client):
    payload = {
        "amount": 50.00,
        "currency": "XYZ",
        "customer_email": "invalid@example.com",
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 400
    assert "Unsupported currency" in response.json()["detail"]


def test_digital_wallet_payment_success(client):
    payload = {
        "wallet_type": "apple_pay",
        "payment_token": "valid_apple_pay_token_12345",
        "currency": "USD",
        "amount": 29.99,
        "customer_email": "apple.user@example.com",
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["amount"] == 29.99
    assert data["currency"] == "USD"
    assert data["wallet_type"] == "apple_pay"
    assert "transaction_id" in data


def test_digital_wallet_payment_google_pay(client):
    payload = {
        "wallet_type": "google_pay",
        "payment_token": "valid_google_pay_token_67890",
        "currency": "EUR",
        "amount": 50.00,
        "customer_email": "google.user@example.com",
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["wallet_type"] == "google_pay"


def test_digital_wallet_invalid_token(client):
    payload = {
        "wallet_type": "apple_pay",
        "payment_token": "expired_payment_token",
        "currency": "USD",
        "amount": 29.99,
        "customer_email": "apple.user@example.com",
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 422
    assert "invalid or expired" in response.json()["detail"].lower()


def test_get_exchange_rates(client):
    response = client.get("/api/v1/payments/rates?base_currency=USD")
    assert response.status_code == 200
    data = response.json()
    assert data["base_currency"] == "USD"
    assert "EUR" in data["rates"]
    assert "GBP" in data["rates"]
    assert "JPY" in data["rates"]
    assert "CAD" in data["rates"]


def test_list_and_get_transactions(client):
    # Initiate a transaction first
    payload = {
        "amount": 75.00,
        "currency": "USD",
        "customer_email": "tx.query@example.com",
    }
    create_res = client.post("/api/v1/payments/checkout-session", json=payload)
    assert create_res.status_code == 200

    # Query transaction list
    list_res = client.get("/api/v1/payments/transactions?search=tx.query@example.com")
    assert list_res.status_code == 200
    tx_list = list_res.json()
    assert len(tx_list) >= 1
    tx_id = tx_list[0]["id"]

    # Query transaction detail
    detail_res = client.get(f"/api/v1/payments/transactions/{tx_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == tx_id
    assert detail["customer_email"] == "tx.query@example.com"
    assert detail["amount"] == 75.00


def test_get_nonexistent_transaction(client):
    response = client.get("/api/v1/payments/transactions/tx_nonexistent_99999")
    assert response.status_code == 404
