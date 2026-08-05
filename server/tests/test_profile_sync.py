import httpx
from unittest.mock import patch, MagicMock
from server.tests.test_payments import get_auth_headers
from server.services.fiserv import FiservLiveService


def test_successful_profile_update_and_sync(client):
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

    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    profile = response.json()
    assert profile["address"] == payload["address"]
    assert profile["phone"] == payload["phone"]
    assert profile["email"] == payload["email"]

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
    headers = get_auth_headers(client)

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

    payload["email"] = "valid@example.com"
    payload["phone"] = "123"
    response = client.put("/api/v1/profile", headers=headers, json=payload)
    assert response.status_code == 400
    assert "phone" in response.json()["detail"]

    payload["phone"] = "212-555-0199"
    payload["address"] = "   "
    response = client.put("/api/v1/profile", headers=headers, json=payload)
    assert response.status_code == 400
    assert "address" in response.json()["detail"]


def test_cenlar_sync_failure_rollback(client):
    headers = get_auth_headers(client)

    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    initial_profile = response.json()

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

    response = client.put("/api/v1/profile", headers=headers, json=payload)
    assert response.status_code == 422
    assert "Failed to sync profile with Cenlar" in response.json()["detail"]

    response = client.post("/api/v1/mock/config", json={"scenario": None})
    assert response.status_code == 200

    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    current_profile = response.json()
    assert current_profile["address"] == initial_profile["address"]
    assert current_profile["phone"] == initial_profile["phone"]
    assert current_profile["email"] == initial_profile["email"]

    response = client.get("/api/v1/profile/history", headers=headers)
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 1
    assert history[0]["status"] == "FAILED"
    assert history[0]["compensation_applied"] is True


def test_unauthorized_profile_access(client):
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


def test_profile_update_live_mode_entitlement_fallback(client):
    headers = get_auth_headers(client)

    payload = {
        "address": "100 Financial Plaza, Dallas, TX 75201",
        "phone": "214-555-0199",
        "email": "live_fallback@example.com",
        "preferences": {
            "paperless": True,
            "email_notif": True,
            "sms_notif": False,
            "marketing": True,
        },
    }

    mock_403 = MagicMock()
    mock_403.status_code = 403
    mock_403.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Forbidden", request=MagicMock(), response=mock_403
    )

    # Patch fiserv_service to be FiservLiveService with mocked network calls returning 403
    from server.main import profile_sync_service
    from server.config import Settings

    live_settings = Settings(
        FISERV_MODE="live",
        FISERV_API_KEY="key",
        FISERV_API_SECRET="secret",
        FISERV_TOKEN_URL="https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2",
        FISERV_BASE_URL="https://bankinghub-cert.fiservapis.com/banking/efx/v1",
        FISERV_ORG_ID="999990301",
        FISERV_DEMO_ACCOUNTS="5041733:DDA",
    )
    live_service = FiservLiveService(live_settings)

    with patch.object(profile_sync_service, "fiserv_service", live_service):
        with patch.object(live_service, "_get_token", return_value="mock-token"):
            with patch("httpx.put", side_effect=[mock_403, mock_403]):
                response = client.put("/api/v1/profile", headers=headers, json=payload)
                assert response.status_code == 200
                data = response.json()
                assert data["address"] == payload["address"]
                assert "metadata" in data
                assert data["metadata"]["live_sync_available"] is False
                assert data["metadata"]["fiserv_sync"] == "FALLBACK_SIMULATED"
                assert data["metadata"]["fallback_reason"] == "ENTITLEMENT_DENIED"

                # Verify history persists FALLBACK_SIMULATED and live_sync_available=False
                res_hist = client.get("/api/v1/profile/history", headers=headers)
                assert res_hist.status_code == 200
                history = res_hist.json()
                latest = history[0]
                assert latest["status"] == "FALLBACK_SIMULATED"
                assert latest["live_sync_available"] is False


def test_profile_update_live_mode_success(client):
    headers = get_auth_headers(client)

    payload = {
        "address": "200 Success Blvd, Dallas, TX 75202",
        "phone": "214-555-0200",
        "email": "live_success@example.com",
        "preferences": {
            "paperless": True,
            "email_notif": True,
            "sms_notif": True,
            "marketing": False,
        },
    }

    mock_ok = MagicMock()
    mock_ok.status_code = 200
    mock_ok.json.return_value = {
        "PartyId": "CIF-982341",
        "Status": {"StatusCode": 0, "Severity": "Info", "StatusDesc": "Success"},
    }

    from server.main import profile_sync_service
    from server.config import Settings

    live_settings = Settings(
        FISERV_MODE="live",
        FISERV_API_KEY="key",
        FISERV_API_SECRET="secret",
        FISERV_TOKEN_URL="https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2",
        FISERV_BASE_URL="https://bankinghub-cert.fiservapis.com/banking/efx/v1",
        FISERV_ORG_ID="999990301",
        FISERV_DEMO_ACCOUNTS="5041733:DDA",
    )
    live_service = FiservLiveService(live_settings)

    with patch.object(profile_sync_service, "fiserv_service", live_service):
        with patch.object(live_service, "_get_token", return_value="mock-token"):
            with patch("httpx.put", return_value=mock_ok):
                response = client.put("/api/v1/profile", headers=headers, json=payload)
                assert response.status_code == 200
                data = response.json()
                assert data["address"] == payload["address"]
                assert "metadata" in data
                assert data["metadata"]["live_sync_available"] is True
                assert data["metadata"]["fiserv_sync"] == "LIVE_SUCCESS"
                assert data["metadata"]["fallback_reason"] is None

                res_hist = client.get("/api/v1/profile/history", headers=headers)
                assert res_hist.status_code == 200
                history = res_hist.json()
                latest = history[0]
                assert latest["status"] == "SUCCESS"
                assert latest["live_sync_available"] is True
