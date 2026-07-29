from unittest.mock import patch
from server.main import fiserv_service, cenlar_service
from server.models import ProfileChangeLog


def get_auth_headers(client):
    # Login to get token
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    mfa_token = response.json()["mfa_token"]

    # Verify MFA
    response = client.post(
        "/api/v1/auth/verify-mfa",
        json={"mfa_token": mfa_token, "code": "123456"},
    )
    assert response.status_code == 200
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_get_profile_success(client):
    headers = get_auth_headers(client)
    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["cif"] == "CIF-982341"
    assert data["email"] == "test@example.com"
    assert data["preferences"]["paperless"] is True


def test_update_profile_success(client, db_session):
    headers = get_auth_headers(client)
    payload = {
        "address": "456 Wall Street, New York, NY 10005",
        "phone": "212-555-0100",
        "email": "new_test@example.com",
        "preferences": {
            "paperless": False,
            "email_notifications": True,
            "sms_notifications": True,
            "marketing_opt_in": True,
        },
    }

    response = client.put("/api/v1/profile", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["address"] == payload["address"]
    assert data["phone"] == payload["phone"]
    assert data["email"] == payload["email"]
    assert data["preferences"]["paperless"] is False
    assert data["preferences"]["sms_notifications"] is True

    # Verify Fiserv reflects new values
    fiserv_prof = fiserv_service.get_customer_profile("CIF-982341")
    assert fiserv_prof["address"] == payload["address"]
    assert fiserv_prof["phone"] == payload["phone"]
    assert fiserv_prof["email"] == payload["email"]
    assert fiserv_prof["preferences"]["paperless"] is False

    # Verify Cenlar reflects new values
    cenlar_prof = cenlar_service.get_borrower_profile("CEN-554321")
    assert cenlar_prof["address"] == payload["address"]
    assert cenlar_prof["phone"] == payload["phone"]
    assert cenlar_prof["email"] == payload["email"]
    assert cenlar_prof["preferences"]["paperless"] is False

    # Verify ProfileChangeLog record created
    log = (
        db_session.query(ProfileChangeLog)
        .order_by(ProfileChangeLog.timestamp.desc())
        .first()
    )
    assert log is not None
    assert log.status == "COMPLETED"
    assert log.changed_fields["address"]["new"] == payload["address"]


def test_update_profile_validation_rejection(client):
    headers = get_auth_headers(client)

    # Test invalid email
    payload = {
        "address": "456 Wall Street, New York, NY 10005",
        "phone": "212-555-0100",
        "email": "invalid-email",
        "preferences": {
            "paperless": False,
            "email_notifications": True,
            "sms_notifications": True,
            "marketing_opt_in": True,
        },
    }
    response = client.put("/api/v1/profile", json=payload, headers=headers)
    assert response.status_code == 400
    assert "email" in response.json()["detail"]

    # Test invalid phone
    payload["email"] = "valid@example.com"
    payload["phone"] = "123"
    response = client.put("/api/v1/profile", json=payload, headers=headers)
    assert response.status_code == 400
    assert "phone" in response.json()["detail"]

    # Test empty address
    payload["phone"] = "212-555-0100"
    payload["address"] = ""
    response = client.put("/api/v1/profile", json=payload, headers=headers)
    assert response.status_code == 400
    assert "address" in response.json()["detail"]


def test_update_profile_cenlar_failure_rollback(client, db_session):
    headers = get_auth_headers(client)

    # Get current values first
    orig_profile = fiserv_service.get_customer_profile("CIF-982341").copy()
    orig_address = orig_profile["address"]
    orig_phone = orig_profile["phone"]
    orig_email = orig_profile["email"]
    orig_prefs = orig_profile["preferences"].copy()

    payload = {
        "address": "789 Broadway, New York, NY 10003",
        "phone": "212-555-9999",
        "email": "failed_sync@example.com",
        "preferences": {
            "paperless": False,
            "email_notifications": False,
            "sms_notifications": False,
            "marketing_opt_in": False,
        },
    }

    # Mock Cenlar to reject update
    with patch.object(cenlar_service, "update_borrower_profile", return_value=False):
        response = client.put("/api/v1/profile", json=payload, headers=headers)
        assert response.status_code == 500
        assert "Failed to sync profile to Cenlar" in response.json()["detail"]

    # Assert Fiserv update rolled back to previous values
    rolled_back_profile = fiserv_service.get_customer_profile("CIF-982341")
    assert rolled_back_profile["address"] == orig_address
    assert rolled_back_profile["phone"] == orig_phone
    assert rolled_back_profile["email"] == orig_email
    assert rolled_back_profile["preferences"]["paperless"] == orig_prefs["paperless"]

    # Assert ProfileChangeLog status = FAILED_CENLAR_SYNC
    log = (
        db_session.query(ProfileChangeLog)
        .order_by(ProfileChangeLog.timestamp.desc())
        .first()
    )
    assert log is not None
    assert log.status == "FAILED_CENLAR_SYNC"


def test_update_profile_unauthorized(client):
    payload = {
        "address": "456 Wall Street, New York, NY 10005",
        "phone": "212-555-0100",
        "email": "new_test@example.com",
        "preferences": {
            "paperless": False,
            "email_notifications": True,
            "sms_notifications": True,
            "marketing_opt_in": True,
        },
    }
    response = client.put("/api/v1/profile", json=payload)
    assert response.status_code == 401
