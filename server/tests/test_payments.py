from server.models.transaction import Transaction


def test_create_checkout_session_same_currency(client):
    payload = {
        "amount": 49.99,
        "currency": "USD",
        "customer_id": "cust_12345",
        "description": "Test Order #1",
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert "payment_intent_id" in data
    assert data["amount_original"] == 49.99
    assert data["currency_original"] == "USD"
    assert data["amount_converted"] == 49.99
    assert data["currency_target"] == "USD"
    assert data["exchange_rate"] == 1.0
    assert data["status"] == "CREATED"


def test_create_checkout_session_multi_currency(client):
    payload = {
        "amount": 100.00,
        "currency": "USD",
        "target_currency": "EUR",
        "customer_id": "cust_67890",
        "description": "Euro Order",
    }
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["currency_original"] == "USD"
    assert data["currency_target"] == "EUR"
    assert data["exchange_rate"] == 0.925
    assert data["amount_converted"] == 92.50
    assert data["status"] == "CREATED"


def test_create_checkout_session_invalid_currency(client):
    payload = {"amount": 50.00, "currency": "INVALID", "customer_id": "cust_999"}
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code in (400, 422)


def test_create_checkout_session_zero_amount(client):
    payload = {"amount": 0.0, "currency": "USD", "customer_id": "cust_999"}
    response = client.post("/api/v1/payments/checkout-session", json=payload)
    assert response.status_code == 422


def test_get_transaction_status(client, db_session):
    tx = Transaction(
        id="tx_test_123",
        amount=100.0,
        currency="USD",
        status="COMPLETED",
        payment_method_type="CREDIT_CARD",
        stripe_payment_intent_id="pi_test_123",
        customer_id="cust_123",
    )
    db_session.add(tx)
    db_session.commit()

    response = client.get("/api/v1/payments/transactions/tx_test_123")
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_id"] == "tx_test_123"
    assert data["status"] == "COMPLETED"
    assert data["amount"] == 100.0


def test_get_non_existent_transaction(client):
    response = client.get("/api/v1/payments/transactions/non_existent_id")
    assert response.status_code == 404
    assert response.json()["detail"] == "Transaction not found"


def test_list_transactions(client, db_session):
    response = client.get("/api/v1/payments/transactions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
