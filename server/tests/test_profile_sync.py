from server.tests.test_payments import get_auth_headers


def test_successful_profile_update_and_sync(client):
    # AC: User can edit address, phone, email, and communication preferences
    # AC: On save, Fiserv profile reflects new values
    # AC: On save, Cenlar borrower profile reflects new values
    # AC: Change recorded in ProfileChangeLog audit table
    headers = get_auth_headers(client)

    payload = {
        "address": "456 Wall Street, New York, NY 10005",
        "phone": "212-555-0199",
        "email": "new_email@example.com",
        "preferences": {
            "paperless": False,
            "email_notif": True,
            "sms_notif": True,
            "marketing": False,
        },
    }

    response = client.put("/api/v1/profile", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["address"] == payload["address"]
    assert data["phone"] == payload["phone"]
    assert data["email"] == payload["email"]
    assert data["preferences"]["paperless"] is False
    assert data["preferences"]["email_notif"] is True
    assert data["preferences"]["sms_notif"] is True
    assert data["preferences"]["marketing"] is False

    # Verify GET /api/v1/profile reflects new values
    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    profile = response.json()
    assert profile["address"] == payload["address"]
    assert profile["phone"] == payload["phone"]
    assert profile["email"] == payload["email"]

    # Verify ProfileChangeLog record created
    response = client.get("/api/v1/profile/history", headers=headers)
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 1
    assert history[0]["status"] == "SUCCESS"
    assert history[0]["changed_fields_after"]["address"] == payload["address"]
    assert history[0]["changed_fields_after"]["phone"] == payload["phone"]
    assert history[0]["changed_fields_after"]["email"] == payload["email"]
    assert history[0]["compensation_applied"] is False


def test_profile_validation_rejection(client):
    # AC: Invalid email/phone/missing fields rejected with clear messages
    # AC: Submission blocked until valid
    headers = get_auth_headers(client)

    # Test invalid email
    payload = {
        "address": "456 Wall Street, New York, NY 10005",
        "phone": "212-555-0199",
        "email": "invalid-email",
        "preferences": {
            "paperless": False,
            "email_notif": True,
            "sms_notif": True,
            "marketing": False,
        },
    }
    response = client.put("/api/v1/profile", headers=headers, json=payload)
    assert response.status_code == 400
    assert "email" in response.json()["detail"]

    # Test invalid phone
    payload["email"] = "valid@example.com"
    payload["phone"] = "123"
    response = client.put("/api/v1/profile", headers=headers, json=payload)
    assert response.status_code == 400
    assert "phone" in response.json()["detail"]

    # Test missing/short address
    payload["phone"] = "212-555-0199"
    payload["address"] = "   "
    response = client.put("/api/v1/profile", headers=headers, json=payload)
    assert response.status_code == 400
    assert "address" in response.json()["detail"]


def test_cenlar_sync_failure_rollback(client):
    # AC: Simulated Cenlar sync failure rolls back Fiserv update (profiles stay consistent)
    headers = get_auth_headers(client)

    # Get initial profile values
    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    initial_profile = response.json()

    # Set mock config to trigger Cenlar failure
    response = client.post("/api/v1/mock/config", json={"scenario": "error_cenlar"})
    assert response.status_code == 200

    payload = {
        "address": "789 Broadway, New York, NY 10003",
        "phone": "212-555-9999",
        "email": "failed_sync@example.com",
        "preferences": {
            "paperless": False,
            "email_notif": False,
            "sms_notif": False,
            "marketing": False,
        },
    }

    # Attempt update (should fail with 422)
    response = client.put("/api/v1/profile", headers=headers, json=payload)
    assert response.status_code == 422
    assert "Failed to sync profile with Cenlar" in response.json()["detail"]

    # Reset mock config
    response = client.post("/api/v1/mock/config", json={"scenario": None})
    assert response.status_code == 200

    # Verify Fiserv profile was rolled back to initial values
    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    current_profile = response.json()
    assert current_profile["address"] == initial_profile["address"]
    assert current_profile["phone"] == initial_profile["phone"]
    assert current_profile["email"] == initial_profile["email"]

    # Verify ProfileChangeLog record created with status = FAILED and compensation_applied = True
    response = client.get("/api/v1/profile/history", headers=headers)
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 1
    assert history[0]["status"] == "FAILED"
    assert history[0]["compensation_applied"] is True


def test_unauthorized_profile_access(client):
    # AC: Call PUT /api/v1/profile without JWT token -> Assert 401 response
    payload = {
        "address": "456 Wall Street, New York, NY 10005",
        "phone": "212-555-0199",
        "email": "new_email@example.com",
        "preferences": {
            "paperless": False,
            "email_notif": True,
            "sms_notif": True,
            "marketing": False,
        },
    }
    response = client.put("/api/v1/profile", json=payload)
    assert response.status_code == 401
