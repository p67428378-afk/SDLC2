def test_list_skus(client):
    response = client.get("/api/v1/skus?category=Snacks")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 12
    assert len(data["items"]) >= 12
    # Verify first item contains expected fields
    first = data["items"][0]
    assert "sku_code" in first
    assert "product_name" in first
    assert "weekly_velocity" in first
    assert "margin_pct" in first
    assert "linear_feet" in first
    assert "is_private_brand" in first
    assert "status_badge" in first
    assert first["status_badge"] in ["GROW", "MAINTAIN", "SWAP", "REDUCE"]


def test_list_skus_pagination(client):
    response = client.get("/api/v1/skus?skip=0&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 5
    assert data["total"] >= 12


def test_search_skus(client):
    response = client.get("/api/v1/skus?search=Pretzels")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert "Pretzel" in item["product_name"] or "Pretzel" in item["sku_code"]


def test_get_sku_by_code(client):
    response = client.get("/api/v1/skus/SKU-10492")
    assert response.status_code == 200
    data = response.json()
    assert data["sku_code"] == "SKU-10492"
    assert data["product_name"] == "DG Value Pretzels 12oz"
    assert data["status_badge"] == "GROW"
    assert data["is_private_brand"] is True


def test_get_sku_by_code_not_found(client):
    response = client.get("/api/v1/skus/NON-EXISTENT-SKU")
    assert response.status_code == 404
