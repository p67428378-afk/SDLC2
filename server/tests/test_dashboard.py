from fastapi.testclient import TestClient


def get_auth_headers(
    client: TestClient,
    username: str = "test@example.com",
    password: str = "testpassword",
):
    login_response = client.post(
        "/api/v1/auth/login", json={"username": username, "password": password}
    )
    mfa_token = login_response.json()["mfa_token"]
    verify_response = client.post(
        "/api/v1/auth/mfa/verify", json={"code": "000000", "mfa_token": mfa_token}
    )
    access_token = verify_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_get_dashboard_success(client: TestClient):
    headers = get_auth_headers(client)
    response = client.get("/api/v1/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "accounts" in data
    assert len(data["accounts"]) > 0
    assert "netWorth" in data
    assert "totalDeposits" in data
    assert "totalMortgage" in data

    # Check specific accounts
    account_names = [acc["name"] for acc in data["accounts"]]
    assert "High-Yield Savings" in account_names
    assert "Home Mortgage" in account_names


def test_get_dashboard_unauthorized(client: TestClient):
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 401


def test_get_dashboard_error_state(client: TestClient):
    # Configure mock to error states
    client.post("/api/v1/mock/config", json={"scenario": "error states"})

    headers = get_auth_headers(client)
    response = client.get("/api/v1/dashboard", headers=headers)
    assert response.status_code == 500
    assert response.json()["detail"] == "Downstream mock API error"

    # Reset mock config
    client.post("/api/v1/mock/config", json={"scenario": "default"})
