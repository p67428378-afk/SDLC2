from fastapi.testclient import TestClient
from server.adapters.fiserv_adapter import MOCK_FISERV_ACCOUNTS
from server.adapters.cenlar_adapter import MOCK_CENLAR_MORTGAGES


def test_login_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_failure(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_eligible_accounts(client: TestClient):
    response = client.get("/api/v1/mortgage/accounts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(acc["accountId"] == "ACC-1111" for acc in data)


def test_validate_payment_success(client: TestClient):
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00
    response = client.post(
        "/api/v1/mortgage/payments/validate",
        json={"source_account_id": "ACC-1111", "amount": 1000.00},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["availableBalance"] == 5000.00
    assert data["sufficientFunds"] is True


def test_validate_payment_insufficient_funds(client: TestClient):
    MOCK_FISERV_ACCOUNTS["ACC-2222"]["balance"] = 50.00
    response = client.post(
        "/api/v1/mortgage/payments/validate",
        json={"source_account_id": "ACC-2222", "amount": 1000.00},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sufficientFunds"] is False


def test_validate_payment_invalid_amount(client: TestClient):
    response = client.post(
        "/api/v1/mortgage/payments/validate",
        json={"source_account_id": "ACC-1111", "amount": 0.50},
    )
    assert response.status_code == 422  # Pydantic validation error


def test_create_payment_immediate_success(client: TestClient):
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00
    MOCK_CENLAR_MORTGAGES["MORT-9999"]["outstandingBalance"] = 245850.00

    response = client.post(
        "/api/v1/mortgage/payments",
        json={
            "source_account_id": "ACC-1111",
            "mortgage_account_id": "MORT-9999",
            "amount": 1000.00,
            "payment_type": "IMMEDIATE",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["paymentId"] is not None
    assert data["transactionId"] is not None
    assert data["cenlarConfirmationId"] is not None


def test_create_payment_immediate_insufficient_funds(client: TestClient):
    MOCK_FISERV_ACCOUNTS["ACC-2222"]["balance"] = 50.00

    response = client.post(
        "/api/v1/mortgage/payments",
        json={
            "source_account_id": "ACC-2222",
            "mortgage_account_id": "MORT-9999",
            "amount": 1000.00,
            "payment_type": "IMMEDIATE",
        },
    )
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]


def test_create_payment_scheduled_success(client: TestClient):
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00

    response = client.post(
        "/api/v1/mortgage/payments",
        json={
            "source_account_id": "ACC-1111",
            "mortgage_account_id": "MORT-9999",
            "amount": 1000.00,
            "payment_type": "SCHEDULED",
            "scheduled_date": "2026-06-01T09:00:00Z",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SCHEDULED"
    assert data["paymentId"] is not None


def test_get_payment_history(client: TestClient):
    # Create a payment first
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00
    client.post(
        "/api/v1/mortgage/payments",
        json={
            "source_account_id": "ACC-1111",
            "mortgage_account_id": "MORT-9999",
            "amount": 1000.00,
            "payment_type": "IMMEDIATE",
        },
    )

    response = client.get("/api/v1/mortgage/payments/history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["amount"] == 1000.00
    assert data[0]["status"] == "COMPLETED"


def test_get_scheduled_payments(client: TestClient):
    client.post(
        "/api/v1/mortgage/payments",
        json={
            "source_account_id": "ACC-1111",
            "mortgage_account_id": "MORT-9999",
            "amount": 1000.00,
            "payment_type": "SCHEDULED",
            "scheduled_date": "2026-06-01T09:00:00Z",
        },
    )

    response = client.get("/api/v1/mortgage/payments/scheduled")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["amount"] == 1000.00
    assert data[0]["status"] == "SCHEDULED"


def test_get_payment_detail(client: TestClient):
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00
    create_res = client.post(
        "/api/v1/mortgage/payments",
        json={
            "source_account_id": "ACC-1111",
            "mortgage_account_id": "MORT-9999",
            "amount": 1000.00,
            "payment_type": "IMMEDIATE",
        },
    )
    payment_id = create_res.json()["paymentId"]

    response = client.get(f"/api/v1/mortgage/payments/{payment_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["paymentId"] == payment_id
    assert data["status"] == "COMPLETED"


def test_get_payment_receipt(client: TestClient):
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00
    create_res = client.post(
        "/api/v1/mortgage/payments",
        json={
            "source_account_id": "ACC-1111",
            "mortgage_account_id": "MORT-9999",
            "amount": 1000.00,
            "payment_type": "IMMEDIATE",
        },
    )
    payment_id = create_res.json()["paymentId"]

    response = client.get(f"/api/v1/mortgage/payments/{payment_id}/receipt")
    assert response.status_code == 200
    data = response.json()
    assert data["paymentId"] == payment_id
    assert "receiptId" in data
    assert data["status"] == "COMPLETED"
