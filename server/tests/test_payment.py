import uuid


def get_auth_headers(client):
    response = client.post(
        "/api/v1/auth/login", json={"username": "testuser", "password": "testpassword"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_mortgage_details(client):
    headers = get_auth_headers(client)
    response = client.get("/api/v1/mortgages/mtg-123", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "mtg-123"
    assert data["loanNumber"] == "MTG-88492"
    assert data["outstandingBalance"] == 250000.00


def test_get_mortgage_details_not_found(client):
    headers = get_auth_headers(client)
    response = client.get("/api/v1/mortgages/non-existent", headers=headers)
    assert response.status_code == 404


def test_list_source_accounts(client):
    headers = get_auth_headers(client)
    response = client.get("/api/v1/accounts", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert any(acc["accountType"] == "DDA" for acc in data)
    assert any(acc["accountType"] == "Savings" for acc in data)


def test_validate_payment_success(client):
    headers = get_auth_headers(client)
    response = client.post(
        "/api/v1/payments/validate",
        headers=headers,
        json={
            "amount": 1500.00,
            "mortgageId": "mtg-123",
            "paymentDate": "2026-08-01",
            "sourceAccountId": "dda-456",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["isValid"] is True
    assert data["isDuplicate"] is False


def test_validate_payment_insufficient_funds(client):
    headers = get_auth_headers(client)
    response = client.post(
        "/api/v1/payments/validate",
        headers=headers,
        json={
            "amount": 99999.00,
            "mortgageId": "mtg-123",
            "paymentDate": "2026-08-01",
            "sourceAccountId": "dda-456",
        },
    )
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]


def test_submit_payment_success(client):
    headers = get_auth_headers(client)
    idempotency_key = str(uuid.uuid4())
    response = client.post(
        "/api/v1/payments",
        headers=headers,
        json={
            "amount": 1500.00,
            "idempotencyKey": idempotency_key,
            "mortgageId": "mtg-123",
            "paymentDate": "2026-08-01",
            "sourceAccountId": "dda-456",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert "confirmationNumber" in data
    assert data["updatedMortgageBalance"] == 248500.00

    # Test Idempotency
    response_dup = client.post(
        "/api/v1/payments",
        headers=headers,
        json={
            "amount": 1500.00,
            "idempotencyKey": idempotency_key,
            "mortgageId": "mtg-123",
            "paymentDate": "2026-08-01",
            "sourceAccountId": "dda-456",
        },
    )
    assert response_dup.status_code == 200
    assert response_dup.json()["transactionId"] == data["transactionId"]


def test_submit_payment_fiserv_timeout(client):
    headers = get_auth_headers(client)
    idempotency_key = str(uuid.uuid4())
    response = client.post(
        "/api/v1/payments",
        headers=headers,
        json={
            "amount": 4999.00,  # Triggers Fiserv timeout in mock adapter
            "idempotencyKey": idempotency_key,
            "mortgageId": "mtg-123",
            "paymentDate": "2026-08-01",
            "sourceAccountId": "dda-456",
        },
    )
    assert response.status_code == 500
    assert "Fiserv debit failed" in response.json()["detail"]


def test_submit_payment_cenlar_timeout_reversal(client):
    headers = get_auth_headers(client)
    idempotency_key = str(uuid.uuid4())
    response = client.post(
        "/api/v1/payments",
        headers=headers,
        json={
            "amount": 3999.00,  # Triggers Cenlar timeout in mock adapter
            "idempotencyKey": idempotency_key,
            "mortgageId": "mtg-123",
            "paymentDate": "2026-08-01",
            "sourceAccountId": "dda-456",
        },
    )
    assert response.status_code == 500
    assert "Saga triggered reversal" in response.json()["detail"]


def test_scheduled_payments_crud(client):
    headers = get_auth_headers(client)

    # Create
    response = client.post(
        "/api/v1/scheduled-payments",
        headers=headers,
        json={
            "amount": 1500.00,
            "endDate": "2027-08-01",
            "frequency": "MONTHLY",
            "mortgageId": "mtg-123",
            "sourceAccountId": "dda-456",
            "startDate": "2026-08-01",
        },
    )
    assert response.status_code == 200
    p_id = response.json()["id"]

    # List
    response_list = client.get("/api/v1/scheduled-payments", headers=headers)
    assert response_list.status_code == 200
    assert len(response_list.json()) == 1

    # Update
    response_update = client.put(
        f"/api/v1/scheduled-payments/{p_id}",
        headers=headers,
        json={
            "amount": 1600.00,
            "endDate": "2027-08-01",
            "frequency": "MONTHLY",
            "isActive": False,
            "startDate": "2026-08-01",
        },
    )
    assert response_update.status_code == 200
    assert response_update.json()["amount"] == 1600.00
    assert response_update.json()["isActive"] is False

    # Delete
    response_delete = client.delete(
        f"/api/v1/scheduled-payments/{p_id}", headers=headers
    )
    assert response_delete.status_code == 200
    assert response_delete.json()["success"] is True


def test_get_payment_history(client):
    headers = get_auth_headers(client)
    response = client.get("/api/v1/mortgages/mtg-123/payments", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["amount"] == 1500.00
