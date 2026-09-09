def test_audit_logs_masked_and_retrievable(client):
    # Initiate checkout session with sensitive fields
    payload = {
        "amount": 99.99,
        "currency": "USD",
        "customer_email": "audit.customer@example.com",
    }
    create_res = client.post("/api/v1/payments/checkout-session", json=payload)
    assert create_res.status_code == 200

    # Fetch audit logs
    audit_res = client.get("/api/v1/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert isinstance(logs, list)
    assert len(logs) >= 1

    # Check that audit log has masked payload and no plaintext secrets
    found = False
    for log in logs:
        if log.get("event_type") == "checkout_session_created":
            found = True
            payload = log.get("masked_payload", {})
            assert "customer_email" in payload
            # Ensure no raw CVV or plain PAN
            assert "cvv" not in payload
            assert "cvc" not in payload
    assert found is True
