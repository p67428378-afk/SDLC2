def test_configure_mock_success(client):
    # AC-I3: Mock API Error Handling - Configure valid scenarios
    scenarios = [
        "default",
        "delinquent",
        "no_accounts",
        "single_account",
        "high_balance",
        "error_fiserv",
        "error_cenlar",
    ]
    for scenario in scenarios:
        response = client.post("/api/v1/mock/config", json={"scenario": scenario})
        assert response.status_code == 200
        assert response.json()["scenario"] == scenario
        assert response.json()["status"] == "success"


def test_configure_mock_invalid(client):
    # AC-I3: Mock API Error Handling - Invalid scenario returns 422
    response = client.post("/api/v1/mock/config", json={"scenario": "invalid_scenario"})
    assert response.status_code == 422


def test_scenario_no_accounts(client, auth_headers):
    # AC-I3: Mock API Error Handling - no_accounts scenario
    config_res = client.post("/api/v1/mock/config", json={"scenario": "no_accounts"})
    assert config_res.status_code == 200

    dashboard_res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert dashboard_res.status_code == 200
    data = dashboard_res.json()
    assert len(data["accounts"]) == 0
    assert data["netWorth"] == 0.0
    assert data["totalDeposits"] == 0.0
    assert data["totalMortgage"] == 0.0


def test_scenario_single_account(client, auth_headers):
    # AC-I3: Mock API Error Handling - single_account scenario
    config_res = client.post("/api/v1/mock/config", json={"scenario": "single_account"})
    assert config_res.status_code == 200

    dashboard_res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert dashboard_res.status_code == 200
    data = dashboard_res.json()
    assert len(data["accounts"]) == 1
    assert data["accounts"][0]["type"] == "Checking"
    assert data["totalDeposits"] == 12750.00
    assert data["totalMortgage"] == 0.0


def test_scenario_high_balance(client, auth_headers):
    # AC-I3: Mock API Error Handling - high_balance scenario
    config_res = client.post("/api/v1/mock/config", json={"scenario": "high_balance"})
    assert config_res.status_code == 200

    dashboard_res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert dashboard_res.status_code == 200
    data = dashboard_res.json()
    assert data["totalDeposits"] == 600000.00 + 150000.00
    assert data["totalMortgage"] == 800000.00


def test_scenario_error_fiserv(client, auth_headers):
    # AC-I3: Mock API Error Handling - error_fiserv scenario
    config_res = client.post("/api/v1/mock/config", json={"scenario": "error_fiserv"})
    assert config_res.status_code == 200

    dashboard_res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert dashboard_res.status_code == 500
    assert "Downstream mock API error" in dashboard_res.json()["detail"]


def test_scenario_error_cenlar(client, auth_headers):
    # AC-I3: Mock API Error Handling - error_cenlar scenario
    config_res = client.post("/api/v1/mock/config", json={"scenario": "error_cenlar"})
    assert config_res.status_code == 200

    dashboard_res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert dashboard_res.status_code == 500
    assert "Downstream mock API error" in dashboard_res.json()["detail"]
