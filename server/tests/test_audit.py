from fastapi.testclient import TestClient


def test_list_audit_logs_seeded(client: TestClient):
    response = client.get("/api/v1/audit-logs")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3

    first_log = data[0]
    assert "id" in first_log
    assert "event_type" in first_log
    assert "masked_payload" in first_log


def test_audit_log_masking(client: TestClient):
    # Trigger a checkout session with credit card data
    payload = {
        "amount": 75.00,
        "currency": "USD",
        "customer_email": "audit.test@example.com",
        "cardholder_name": "Audit Tester",
        "card_number": "4111111111111234",
        "exp_month": 11,
        "exp_year": 2029,
        "cvv": "987",
    }
    client.post("/api/v1/payments/checkout-session", json=payload)

    # Fetch audit logs
    response = client.get("/api/v1/audit-logs?event_type=checkout_session")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

    found_masked = False
    for entry in data:
        masked = entry.get("masked_payload")
        if masked and "card_number" in masked:
            assert "****" in masked["card_number"]
            assert "4111111111111234" not in str(masked)
            found_masked = True
    assert found_masked


def test_list_audit_logs_filtered_by_transaction(client: TestClient):
    response = client.get("/api/v1/audit-logs?transaction_id=tx_1001")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["transaction_id"] == "tx_1001"
