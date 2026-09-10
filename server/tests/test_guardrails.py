def test_guardrails_all_passed(client):
    payload = {
        "shelf_capacity_pct": 92.0,
        "private_brand_pct": 28.0,
        "in_stock_rate_pct": 96.5,
    }
    response = client.post("/api/v1/guardrails/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["all_passed"] is True
    assert len(data["guardrails"]) == 3
    for g in data["guardrails"]:
        assert g["status"] == "PASSED"


def test_guardrails_capacity_failed(client):
    payload = {
        "shelf_capacity_pct": 105.0,
        "private_brand_pct": 28.0,
        "in_stock_rate_pct": 96.5,
    }
    response = client.post("/api/v1/guardrails/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["all_passed"] is False
    cap = next(g for g in data["guardrails"] if g["name"] == "Shelf Capacity")
    assert cap["status"] == "FAILED"


def test_guardrails_private_brand_failed(client):
    payload = {
        "shelf_capacity_pct": 90.0,
        "private_brand_pct": 22.0,
        "in_stock_rate_pct": 96.5,
    }
    response = client.post("/api/v1/guardrails/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["all_passed"] is False
    pb = next(g for g in data["guardrails"] if g["name"] == "Private Brand Share")
    assert pb["status"] == "FAILED"


def test_guardrails_instock_failed(client):
    payload = {
        "shelf_capacity_pct": 90.0,
        "private_brand_pct": 28.0,
        "in_stock_rate_pct": 92.0,
    }
    response = client.post("/api/v1/guardrails/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["all_passed"] is False
    stock = next(g for g in data["guardrails"] if g["name"] == "In-Stock SLA Rate")
    assert stock["status"] == "FAILED"
