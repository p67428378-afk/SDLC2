def test_get_kpi_metrics(client):
    response = client.get("/api/v1/metrics/kpi?cluster_name=Small+Town+Value+Cluster&category=Snacks")
    assert response.status_code == 200
    data = response.json()
    assert data["cluster_name"] == "Small Town Value Cluster"
    assert data["category"] == "Snacks"
    assert data["sales_per_linear_ft"] == 450.00
    assert data["private_brand_pct"] == 28.00
    assert data["in_stock_rate_pct"] == 96.50
    assert data["shelf_capacity_pct"] == 92.00
    assert "last_updated" in data


def test_get_kpi_metrics_defaults(client):
    response = client.get("/api/v1/metrics/kpi")
    assert response.status_code == 200
    data = response.json()
    assert data["cluster_name"] == "Small Town Value Cluster"
    assert data["category"] == "Snacks"


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
