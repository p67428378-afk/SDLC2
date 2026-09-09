def test_process_partial_and_full_refund(client):
    # Create a completed transaction via digital wallet
    tx_payload = {
        "wallet_type": "apple_pay",
        "payment_token": "valid_token_for_refund",
        "currency": "USD",
        "amount": 100.00,
        "customer_email": "refund.test@example.com",
    }
    tx_res = client.post("/api/v1/payments/digital-wallet", json=tx_payload)
    assert tx_res.status_code == 200
    tx_id = tx_res.json()["transaction_id"]

    # 1. Partial refund of $30.00
    refund_1 = {
        "transaction_id": tx_id,
        "amount": 30.00,
        "reason": "Customer dissatisfaction",
        "memo": "Partial refund for late delivery",
    }
    ref_res_1 = client.post("/api/v1/refunds", json=refund_1)
    assert ref_res_1.status_code == 201
    ref_data_1 = ref_res_1.json()
    assert ref_data_1["refund_amount"] == 30.00
    assert ref_data_1["status"] == "SUCCEEDED"

    # Verify transaction status changed to PARTIALLY_REFUNDED
    tx_detail_1 = client.get(f"/api/v1/payments/transactions/{tx_id}").json()
    assert tx_detail_1["status"] == "PARTIALLY_REFUNDED"
    assert tx_detail_1["refunded_amount"] == 30.00
    assert tx_detail_1["remaining_refundable_balance"] == 70.00
    assert len(tx_detail_1["refunds"]) == 1

    # 2. Refund exceeding remaining balance of $70.00 -> Should fail with 400
    refund_excess = {
        "transaction_id": tx_id,
        "amount": 75.00,
        "reason": "Excessive refund attempt",
    }
    ref_excess_res = client.post("/api/v1/refunds", json=refund_excess)
    assert ref_excess_res.status_code == 400
    assert "cannot exceed remaining balance" in ref_excess_res.json()["detail"].lower()

    # 3. Full remaining refund of $70.00 -> Transaction status becomes REFUNDED
    refund_2 = {
        "transaction_id": tx_id,
        "amount": 70.00,
        "reason": "Settlement of remaining balance",
    }
    ref_res_2 = client.post("/api/v1/refunds", json=refund_2)
    assert ref_res_2.status_code == 201

    tx_detail_2 = client.get(f"/api/v1/payments/transactions/{tx_id}").json()
    assert tx_detail_2["status"] == "REFUNDED"
    assert tx_detail_2["remaining_refundable_balance"] == 0.0
    assert len(tx_detail_2["refunds"]) == 2

    # 4. Attempt refund on already fully refunded transaction -> 400
    ref_res_3 = client.post("/api/v1/refunds", json=refund_2)
    assert ref_res_3.status_code == 400


def test_refund_invalid_transaction(client):
    payload = {
        "transaction_id": "tx_invalid_does_not_exist",
        "amount": 25.00,
        "reason": "Invalid transaction test",
    }
    response = client.post("/api/v1/refunds", json=payload)
    assert response.status_code == 400


def test_list_refunds(client):
    response = client.get("/api/v1/refunds")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
