def test_evaluate_balanced_scenario(client):
    payload = {
        "cluster_name": "Small Town Value Cluster",
        "category": "Snacks",
        "scenario_type": "Balanced",
    }
    response = client.post("/api/v1/scenarios/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_type"] == "Balanced"
    assert data["projected_sales_lift_pct"] == 5.8
    assert data["projected_private_brand_share_pct"] == 28.0
    assert data["projected_margin_delta_pct"] == 1.5
    assert "recommended_sku_actions" in data
    assert data["recommended_sku_actions"]["GROW"] == 4


def test_evaluate_aggressive_scenario(client):
    payload = {
        "cluster_name": "Small Town Value Cluster",
        "category": "Snacks",
        "scenario_type": "Aggressive",
    }
    response = client.post("/api/v1/scenarios/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_type"] == "Aggressive"
    assert data["projected_sales_lift_pct"] == 8.5
    assert data["projected_private_brand_share_pct"] == 31.2
    assert data["projected_margin_delta_pct"] == 2.4


def test_evaluate_conservative_scenario(client):
    payload = {
        "cluster_name": "Small Town Value Cluster",
        "category": "Snacks",
        "scenario_type": "Conservative",
    }
    response = client.post("/api/v1/scenarios/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_type"] == "Conservative"
    assert data["projected_sales_lift_pct"] == 3.2


def test_evaluate_invalid_scenario(client):
    payload = {
        "scenario_type": "Extreme",
    }
    response = client.post("/api/v1/scenarios/evaluate", json=payload)
    assert response.status_code == 400


def test_list_scenarios(client):
    response = client.get("/api/v1/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    scenario_names = [s["scenario_type"] for s in data]
    assert "Conservative" in scenario_names
    assert "Balanced" in scenario_names
    assert "Aggressive" in scenario_names
