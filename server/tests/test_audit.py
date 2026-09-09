from server.services.audit_service import (
    sanitize_data,
    mask_pan_string,
    log_audit_event,
)


def test_pan_masking():
    raw_pan = "Customer card is 4111222233334444 used for purchase"
    masked = mask_pan_string(raw_pan)
    assert "4111222233334444" not in masked
    assert "****-****-****-4444" in masked


def test_sensitive_data_sanitization():
    payload = {
        "card_number": "5555444433332222",
        "cvv": "123",
        "card_cvc": "999",
        "secret": "super_secret_token",
        "amount": 150.00,
        "customer": {"pan": "4000123456789010", "name": "Jane Doe"},
    }
    sanitized = sanitize_data(payload)
    assert sanitized["cvv"] == "***"
    assert sanitized["card_cvc"] == "***"
    assert sanitized["secret"] == "[REDACTED]"
    assert "5555444433332222" not in str(sanitized["card_number"])
    assert "2222" in str(sanitized["card_number"])
    assert sanitized["customer"]["pan"] == "****-****-****-9010"
    assert sanitized["customer"]["name"] == "Jane Doe"
    assert sanitized["amount"] == 150.00


def test_audit_log_endpoint(client, db_session):
    log_audit_event(
        db=db_session,
        action="TEST_PAYMENT_INITIATED",
        actor_id="test_actor",
        payload={"amount": 99.0, "card_number": "4111111111111111", "cvv": "123"},
    )

    res = client.get("/api/v1/audit-logs")
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) >= 1
    target = next(l for l in logs if l["action"] == "TEST_PAYMENT_INITIATED")
    assert target["actor_id"] == "test_actor"
    assert target["masked_payload"]["cvv"] == "***"
    assert "4111111111111111" not in str(target["masked_payload"])
