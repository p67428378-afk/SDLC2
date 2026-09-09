from fastapi.testclient import TestClient


def test_create_checkout_session_usd(client: TestClient):
    payload = {
        "amount": 49.99,
        "currency": "USD",
        "customer_email": "buyer@example.com",
        "cardholder_name": "Jane Buyer",
        "card_number": "4242424242424242",
        "exp_month": 12,
        "exp_year": 2028,
        "cvv": "123",
        "items": [{"name": "Premium T-Shirt", "price": 49.99, "quantity": 1}],
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert "payment_intent_id" in data
    assert data["base_amount"] == 49.99
    assert data["base_currency"] == "USD"
    assert data["target_amount"] == 49.99
    assert data["target_currency"] == "USD"
    assert data["exchange_rate"] == 1.0


def test_create_checkout_session_with_unit_price(client: TestClient):
    payload = {
        "amount": 49.99,
        "currency": "USD",
        "customer_email": "unitprice.buyer@example.com",
        "items": [
            {"name": "Pro Subscription (Monthly)", "quantity": 1, "unit_price": 49.99}
        ],
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert "payment_intent_id" in data
    assert data["base_amount"] == 49.99


def test_create_checkout_session_eur_conversion(client: TestClient):
    payload = {
        "amount": 100.00,
        "currency": "EUR",
        "customer_email": "euro.buyer@example.com",
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["target_currency"] == "EUR"
    assert data["exchange_rate"] == 0.9250
    assert data["target_amount"] == 92.50


def test_create_checkout_session_invalid_currency(client: TestClient):
    payload = {
        "amount": 50.00,
        "currency": "XYZ",
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 400
    assert "Unsupported currency" in response.json()["detail"]


def test_digital_wallet_payment_apple_pay(client: TestClient):
    payload = {
        "wallet_type": "apple_pay",
        "payment_token": "pk_token_valid_apple_payload_12345",
        "amount": 35.50,
        "currency": "USD",
        "customer_email": "apple.user@example.com",
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert "transaction_id" in data
    assert data["payment_method"] == "apple_pay"


def test_digital_wallet_payment_invalid_token(client: TestClient):
    payload = {
        "wallet_type": "google_pay",
        "payment_token": "token_expired_999",
        "amount": 25.00,
        "currency": "USD",
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 422
    assert (
        "expired" in response.json()["detail"] or "invalid" in response.json()["detail"]
    )


def test_digital_wallet_payment_unsupported_wallet(client: TestClient):
    payload = {
        "wallet_type": "crypto_wallet",
        "payment_token": "valid_token",
        "amount": 20.00,
        "currency": "USD",
    }
    response = client.post("/api/v1/payments/digital-wallet", json=payload)
    assert response.status_code == 422


def test_list_transactions_seeded(client: TestClient):
    response = client.get("/api/v1/payments/transactions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    # Verify fields
    first_tx = data[0]
    assert "id" in first_tx
    assert "amount" in first_tx
    assert "currency" in first_tx
    assert "status" in first_tx
    assert "created_at" in first_tx


def test_list_transactions_filtered_by_status(client: TestClient):
    response = client.get("/api/v1/payments/transactions?status=COMPLETED")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for tx in data:
        assert tx["status"] == "COMPLETED"


def test_get_transaction_by_id_success(client: TestClient):
    response = client.get("/api/v1/payments/transactions/tx_1001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "tx_1001"
    assert data["amount"] == 149.99
    assert data["currency"] == "USD"
    assert data["status"] == "COMPLETED"


def test_get_transaction_by_id_not_found(client: TestClient):
    response = client.get("/api/v1/payments/transactions/tx_non_existent_99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_get_exchange_rates(client: TestClient):
    response = client.get("/api/v1/payments/rates")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5

    eur_rate = next((r for r in data if r["target_currency"] == "EUR"), None)
    assert eur_rate is not None
    assert eur_rate["rate"] == 0.9250


def test_get_exchange_rate_target_filter(client: TestClient):
    response = client.get(
        "/api/v1/payments/rates?base_currency=USD&target_currency=GBP"
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["target_currency"] == "GBP"
    assert data[0]["rate"] == 0.7850
