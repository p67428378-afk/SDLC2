from fastapi.testclient import TestClient


def test_process_partial_refund_success(client: TestClient):
    payload = {
        "transaction_id": "tx_1001",
        "amount": 40.00,
        "reason": "Customer returned partial item",
        "memo": "1 of 2 shirts returned",
    }
    response = client.post("/api/v1/refunds", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["transaction_id"] == "tx_1001"
    assert data["refund_amount"] == 40.00
    assert data["status"] == "SUCCEEDED"

    # Verify transaction status updated
    tx_resp = client.get("/api/v1/payments/transactions/tx_1001")
    assert tx_resp.status_code == 200
    tx_data = tx_resp.json()
    assert tx_data["status"] == "PARTIALLY_REFUNDED"
    assert tx_data["refunded_amount"] == 40.00
    assert tx_data["remaining_refundable_balance"] == round(149.99 - 40.00, 2)


def test_process_refund_exceeding_balance(client: TestClient):
    payload = {
        "transaction_id": "tx_1001",
        "amount": 999.00,
        "reason": "Excess refund",
    }
    response = client.post("/api/v1/refunds", json=payload)
    assert response.status_code == 400
    assert "cannot exceed" in response.json()["detail"]


def test_process_refund_already_fully_refunded(client: TestClient):
    payload = {
        "transaction_id": "tx_1004",  # tx_1004 is seeded as REFUNDED
        "amount": 10.00,
        "reason": "Extra refund attempt",
    }
    response = client.post("/api/v1/refunds", json=payload)
    assert response.status_code == 400
    assert "already fully refunded" in response.json()["detail"]


def test_process_refund_invalid_transaction(client: TestClient):
    payload = {
        "transaction_id": "tx_fake_99999",
        "amount": 20.00,
        "reason": "Test non-existent",
    }
    response = client.post("/api/v1/refunds", json=payload)
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]


def test_list_refunds(client: TestClient):
    response = client.get("/api/v1/refunds")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_list_refunds_filtered_by_transaction(client: TestClient):
    response = client.get("/api/v1/refunds?transaction_id=tx_1003")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["transaction_id"] == "tx_1003"
