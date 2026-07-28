from fastapi.testclient import TestClient
from server.tests.test_dashboard import get_auth_headers


def test_get_account_details_success(client: TestClient):
    headers = get_auth_headers(client)

    # First get dashboard to find a valid account ID
    dashboard_response = client.get("/api/v1/dashboard", headers=headers)
    accounts = dashboard_response.json()["accounts"]
    assert len(accounts) > 0
    target_id = accounts[0]["id"]

    # Get details
    response = client.get(f"/api/v1/accounts/{target_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == target_id
    assert "details" in data
    assert isinstance(data["details"], dict)


def test_get_account_details_not_found(client: TestClient):
    headers = get_auth_headers(client)
    response = client.get("/api/v1/accounts/non-existent-id", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Account not found"


def test_get_account_details_unauthorized(client: TestClient):
    response = client.get("/api/v1/accounts/fiserv-sav-1")
    assert response.status_code == 401
