def test_get_account_details_success(client, auth_headers):
    # AC-B4: API Endpoints for Account Details - Happy path
    dashboard_res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert dashboard_res.status_code == 200
    accounts = dashboard_res.json()["accounts"]
    assert len(accounts) > 0

    account_id = accounts[0]["id"]
    response = client.get(f"/api/v1/accounts/{account_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == account_id
    assert "details" in data
    assert "interestRate" in data["details"]


def test_get_account_details_not_found(client, auth_headers):
    # AC-B4: API Endpoints for Account Details - Account not found
    response = client.get("/api/v1/accounts/non-existent-id", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Account not found"
