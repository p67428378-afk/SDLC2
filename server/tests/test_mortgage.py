from fastapi.testclient import TestClient
from datetime import date, timedelta


def get_auth_headers(
    client: TestClient, username="test@example.com", password="testpassword"
):
    response = client.post(
        "/auth/dummy-login", json={"username": username, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_mortgage_details(client: TestClient):
    # AC 1: Customer can view their mortgage account details including current balance and minimum payment due.
    headers = get_auth_headers(client)
    response = client.get("/api/v1/mortgage/details", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["loanNumber"] == "30049182"
    assert data["currentBalance"] == 245850.00
    assert data["minimumPaymentAmount"] == 1250.00
    assert data["nextPaymentDueDate"] == "2026-06-01"
    assert data["interestRate"] == 4.25
    assert data["escrowBalance"] == 4500.00


def test_get_funding_accounts(client: TestClient):
    # AC 2: Both DDA and Savings accounts are displayed as selectable payment sources on the Make Payment screen.
    headers = get_auth_headers(client)
    response = client.get("/api/v1/mortgage/accounts", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    # Verify DDA and Savings are present
    types = [acc["accountType"] for acc in data]
    assert "DDA" in types
    assert "Savings" in types


def test_validate_account_balance_success(client: TestClient):
    # AC 3: Selecting an account triggers a real-time Fiserv balance inquiry; sufficient balance returns true.
    headers = get_auth_headers(client)
    response = client.post(
        "/api/v1/mortgage/accounts/dda-123/validate",
        headers=headers,
        json={"paymentAmount": 1250.00},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sufficientFunds"] is True
    assert data["availableBalance"] == 5000.00


def test_validate_account_balance_insufficient(client: TestClient):
    # AC 3: Selecting an account triggers a real-time Fiserv balance inquiry; insufficient balance returns false.
    headers = get_auth_headers(client)
    response = client.post(
        "/api/v1/mortgage/accounts/dda-low/validate",
        headers=headers,
        json={"paymentAmount": 1250.00},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sufficientFunds"] is False
    assert data["availableBalance"] == 100.00


def test_submit_payment_success(client: TestClient):
    # AC 4: Successful submission debits the DDA/Savings account via Fiserv and sends a payment instruction to Cenlar.
    headers = get_auth_headers(client)

    # Submit payment
    today_str = date.today().strftime("%Y-%m-%d")
    response = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": today_str,
            "fromAccountId": "dda-123",
            "loanNumber": "30049182",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["PROCESSED", "SCHEDULED"]
    assert "transactionId" in data
    assert "cenlarConfirmationId" in data


def test_submit_payment_updates_balance(client: TestClient):
    # AC 5: Mortgage loan balance reflects the payment after Cenlar processes it.
    headers = get_auth_headers(client)

    # Submit payment (processed same day if before cutoff)
    today_str = date.today().strftime("%Y-%m-%d")
    response = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": today_str,
            "fromAccountId": "dda-123",
            "loanNumber": "30049182",
        },
    )
    assert response.status_code == 200
    payment_data = response.json()

    # If processed same day, check that balance is updated
    if payment_data["status"] == "PROCESSED":
        details_response = client.get("/api/v1/mortgage/details", headers=headers)
        assert details_response.status_code == 200
        details_data = details_response.json()
        assert details_data["currentBalance"] == 245850.00 - 1250.00


def test_get_payment_receipt(client: TestClient):
    # AC 6: Customer receives a confirmation screen with a unique payment reference number and can download a receipt.
    headers = get_auth_headers(client)

    # Submit payment
    today_str = date.today().strftime("%Y-%m-%d")
    response = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": today_str,
            "fromAccountId": "dda-123",
            "loanNumber": "30049182",
        },
    )
    assert response.status_code == 200
    payment_data = response.json()
    tx_id = payment_data["transactionId"]

    # Get receipt
    receipt_response = client.get(
        f"/api/v1/mortgage/payments/{tx_id}/receipt", headers=headers
    )
    assert receipt_response.status_code == 200
    receipt_data = receipt_response.json()
    assert receipt_data["amount"] == 1250.00
    assert receipt_data["transactionId"] == tx_id
    assert "receiptId" in receipt_data


def test_get_scheduled_payments(client: TestClient):
    # AC 7: The payment appears in the Scheduled Payments view with correct status.
    headers = get_auth_headers(client)

    # Submit a future-dated payment
    future_date_str = (date.today() + timedelta(days=5)).strftime("%Y-%m-%d")
    response = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": future_date_str,
            "fromAccountId": "dda-123",
            "loanNumber": "30049182",
        },
    )
    assert response.status_code == 200
    payment_data = response.json()
    assert payment_data["status"] == "SCHEDULED"

    # Get scheduled payments
    scheduled_response = client.get(
        "/api/v1/mortgage/payments/scheduled", headers=headers
    )
    assert scheduled_response.status_code == 200
    scheduled_data = scheduled_response.json()
    assert len(scheduled_data) >= 1
    assert scheduled_data[0]["status"] == "SCHEDULED"
    assert scheduled_data[0]["amount"] == 1250.00


def test_submit_payment_insufficient_funds(client: TestClient):
    # AC 8: Edge case: insufficient funds
    headers = get_auth_headers(client)

    today_str = date.today().strftime("%Y-%m-%d")
    response = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": today_str,
            "fromAccountId": "dda-low",
            "loanNumber": "30049182",
        },
    )
    assert response.status_code == 400
    assert "Insufficient funds" in response.json()["detail"]


def test_submit_payment_fiserv_timeout(client: TestClient):
    # AC 8: Edge case: Fiserv timeout
    headers = get_auth_headers(client)

    today_str = date.today().strftime("%Y-%m-%d")
    response = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": today_str,
            "fromAccountId": "timeout-account",
            "loanNumber": "30049182",
        },
    )
    assert response.status_code == 504
    assert "timed out" in response.json()["detail"]


def test_submit_payment_cenlar_rejection(client: TestClient):
    # AC 8: Edge case: Cenlar rejection
    headers = get_auth_headers(client)

    today_str = date.today().strftime("%Y-%m-%d")
    response = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": today_str,
            "fromAccountId": "dda-123",
            "loanNumber": "reject-loan",
        },
    )
    assert response.status_code == 500
    assert "rejected" in response.json()["detail"]


def test_submit_payment_duplicate_warning(client: TestClient):
    # AC 8: Edge case: duplicate payment warning
    headers = get_auth_headers(client)

    today_str = date.today().strftime("%Y-%m-%d")
    # First payment
    response1 = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": today_str,
            "fromAccountId": "dda-123",
            "loanNumber": "30049182",
        },
    )
    assert response1.status_code == 200

    # Second identical payment on same day
    response2 = client.post(
        "/api/v1/mortgage/payments",
        headers=headers,
        json={
            "amount": 1250.00,
            "date": today_str,
            "fromAccountId": "dda-123",
            "loanNumber": "30049182",
        },
    )
    assert response2.status_code == 400
    assert "Duplicate payment warning" in response2.json()["detail"]
