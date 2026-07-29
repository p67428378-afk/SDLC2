from datetime import datetime, timedelta


def get_auth_headers(client, username="test@example.com", password="testpassword"):
    # Login
    response = client.post(
        "/api/v1/auth/login", json={"username": username, "password": password}
    )
    assert response.status_code == 200
    mfa_token = response.json()["mfa_token"]

    # Verify MFA
    response = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": "123456"}
    )
    assert response.status_code == 200
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_get_payment_sources(client):
    headers = get_auth_headers(client)
    response = client.get("/api/v1/payments/sources/cenlar-mort-1", headers=headers)
    assert response.status_code == 200
    sources = response.json()
    # Should only return DDA and Savings (exclude CD and Loan)
    assert len(sources) == 2
    types = [s["type"] for s in sources]
    assert "DDA" in types
    assert "Savings" in types
    assert "CD" not in types
    assert "Loan" not in types


def test_get_payment_sources_unauthorized(client):
    response = client.get("/api/v1/payments/sources/cenlar-mort-1")
    assert response.status_code == 401


def test_get_payment_sources_not_found(client):
    headers = get_auth_headers(client)
    response = client.get(
        "/api/v1/payments/sources/non-existent-mortgage", headers=headers
    )
    assert response.status_code == 404


def test_successful_payment(client):
    headers = get_auth_headers(client)
    headers["Idempotency-Key"] = "unique-key-1"

    # Get initial balances
    response = client.get("/api/v1/accounts/banking", headers=headers)
    assert response.status_code == 200
    dda_acc = next(a for a in response.json() if a["id"] == "fiserv-dda-1")
    initial_dda_balance = dda_acc["balance"]

    response = client.get("/api/v1/accounts/mortgage", headers=headers)
    assert response.status_code == 200
    mort_acc = next(m for m in response.json() if m["id"] == "cenlar-mort-1")
    initial_mort_balance = mort_acc["principal_balance"]

    # Execute payment
    payment_amount = 1000.00
    response = client.post(
        "/api/v1/payments/mortgage",
        headers=headers,
        json={
            "source_account_id": "fiserv-dda-1",
            "mortgage_account_id": "cenlar-mort-1",
            "amount": payment_amount,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == payment_amount
    assert "confirmation_number" in data
    assert data["updated_source_balance"] == initial_dda_balance - payment_amount

    # Principal reduction is 40% of payment amount (1000 * 0.4 = 400)
    expected_mort_balance = initial_mort_balance - 400.00
    assert data["updated_mortgage_balance"] == expected_mort_balance

    # Verify payment history
    response = client.get("/api/v1/payments", headers=headers)
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 1
    assert history[0]["amount"] == payment_amount
    assert history[0]["source_account_id"] == "fiserv-dda-1"
    assert history[0]["mortgage_account_id"] == "cenlar-mort-1"


def test_insufficient_balance_rejection(client):
    headers = get_auth_headers(client)
    headers["Idempotency-Key"] = "unique-key-2"

    # Execute payment with amount greater than balance
    payment_amount = 50000.00
    response = client.post(
        "/api/v1/payments/mortgage",
        headers=headers,
        json={
            "source_account_id": "fiserv-dda-1",
            "mortgage_account_id": "cenlar-mort-1",
            "amount": payment_amount,
        },
    )
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]


def test_idempotency(client):
    headers = get_auth_headers(client)
    headers["Idempotency-Key"] = "same-key"

    payload = {
        "source_account_id": "fiserv-dda-1",
        "mortgage_account_id": "cenlar-mort-1",
        "amount": 100.00,
    }

    # First request
    response1 = client.post("/api/v1/payments/mortgage", headers=headers, json=payload)
    assert response1.status_code == 200
    conf1 = response1.json()["confirmation_number"]

    # Second request with same key
    response2 = client.post("/api/v1/payments/mortgage", headers=headers, json=payload)
    assert response2.status_code == 200
    conf2 = response2.json()["confirmation_number"]

    assert conf1 == conf2


def test_schedule_and_cancel_payment(client):
    headers = get_auth_headers(client)

    future_date = (datetime.utcnow() + timedelta(days=5)).date().isoformat()
    payload = {
        "source_account_id": "fiserv-dda-1",
        "mortgage_account_id": "cenlar-mort-1",
        "amount": 500.00,
        "scheduled_date": future_date,
    }

    # Schedule
    response = client.post("/api/v1/payments/scheduled", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 500.00
    assert data["scheduled_date"] == future_date
    assert data["status"] == "PENDING"
    payment_id = data["id"]

    # List
    response = client.get("/api/v1/payments/scheduled", headers=headers)
    assert response.status_code == 200
    scheduled_list = response.json()
    assert len(scheduled_list) == 1
    assert scheduled_list[0]["id"] == payment_id

    # Cancel
    response = client.delete(
        f"/api/v1/payments/scheduled/{payment_id}", headers=headers
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # List again (should be empty since we only list PENDING)
    response = client.get("/api/v1/payments/scheduled", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 0
