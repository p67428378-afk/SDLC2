def test_get_dashboard_success(client, auth_headers):
    # AC-B2: Data Aggregation Service - Happy path dashboard aggregation
    response = client.get("/api/v1/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "accounts" in data
    assert "netWorth" in data
    assert "totalDeposits" in data
    assert "totalMortgage" in data

    # Check default scenario values
    assert data["totalDeposits"] == 85400.00 + 12750.00 + 14000.00
    assert data["totalMortgage"] == 230000.00
    assert data["netWorth"] == data["totalDeposits"] + data["totalMortgage"]


def test_get_dashboard_unauthorized(client):
    # AC-B2: Data Aggregation Service - Unauthorized access
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 401
