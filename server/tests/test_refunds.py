from server.models.transaction import Transaction


def test_partial_and_full_refund_flow(client, db_session):
    # 1. Create a transaction for 100 EUR
    tx = Transaction(
        id="tx_refund_test_100",
        amount=100.0,
        currency="EUR",
        status="COMPLETED",
        payment_method_type="CREDIT_CARD",
        stripe_payment_intent_id="pi_for_refund_100",
        customer_id="cust_refund_user",
    )
    db_session.add(tx)
    db_session.commit()

    # 2. Process partial refund of 40 EUR
    res1 = client.post(
        "/api/v1/refunds",
        json={
            "transaction_id": "tx_refund_test_100",
            "amount": 40.0,
            "reason": "Customer changed mind on item",
        },
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["transaction_id"] == "tx_refund_test_100"
    assert data1["amount_refunded"] == 40.0
    assert data1["currency"] == "EUR"
    assert data1["status"] == "SUCCEEDED"

    # Check updated transaction status
    tx_check = client.get("/api/v1/payments/transactions/tx_refund_test_100").json()
    assert tx_check["status"] == "PARTIALLY_REFUNDED"
    assert len(tx_check["refunds"]) == 1

    # 3. Process remaining 60 EUR refund
    res2 = client.post(
        "/api/v1/refunds",
        json={
            "transaction_id": "tx_refund_test_100",
            "amount": 60.0,
            "reason": "Return remaining items",
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["amount_refunded"] == 60.0

    # Check final transaction status
    tx_check2 = client.get("/api/v1/payments/transactions/tx_refund_test_100").json()
    assert tx_check2["status"] == "REFUNDED"
    assert len(tx_check2["refunds"]) == 2


def test_refund_exceeding_balance(client, db_session):
    tx = Transaction(
        id="tx_refund_overflow",
        amount=50.0,
        currency="USD",
        status="COMPLETED",
        payment_method_type="CREDIT_CARD",
        stripe_payment_intent_id="pi_overflow",
        customer_id="cust_overflow",
    )
    db_session.add(tx)
    db_session.commit()

    # Request refund for 60 on a 50 transaction
    res = client.post(
        "/api/v1/refunds",
        json={
            "transaction_id": "tx_refund_overflow",
            "amount": 60.0,
            "reason": "Too much",
        },
    )
    assert res.status_code == 400
    assert "exceeds" in res.json()["detail"].lower()


def test_refund_non_existent_transaction(client):
    res = client.post(
        "/api/v1/refunds", json={"transaction_id": "tx_does_not_exist", "amount": 10.0}
    )
    assert res.status_code == 404


def test_refund_invalid_status(client, db_session):
    tx = Transaction(
        id="tx_failed_status",
        amount=50.0,
        currency="USD",
        status="FAILED",
        payment_method_type="CREDIT_CARD",
        stripe_payment_intent_id="pi_failed",
        customer_id="cust_fail",
    )
    db_session.add(tx)
    db_session.commit()

    res = client.post(
        "/api/v1/refunds", json={"transaction_id": "tx_failed_status", "amount": 10.0}
    )
    assert res.status_code == 400
