from fastapi import status


def test_read_root(client):
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "message": "Welcome to DG Cluster Assortment Advisor API"
    }


def test_get_kpis(client):
    response = client.get("/api/v1/kpis")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "sales_per_linear_ft" in data
    assert "private_brand_pct" in data
    assert "in_stock_rate" in data
    assert "shelf_capacity" in data
    assert data["sales_per_linear_ft"] == 1245.50
    assert data["private_brand_pct"] == 24.5
    assert data["in_stock_rate"] == 96.2
    assert data["shelf_capacity"] == 4500.0


def test_get_skus(client):
    response = client.get("/api/v1/skus")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 4

    # Test filtering by status
    response = client.get("/api/v1/skus?status=GROW")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["sku_id"] == "SKU-10042"

    # Test sorting by sales
    response = client.get("/api/v1/skus?sort_by=sales")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data[0]["sku_id"] == "SKU-89211"  # Doritos has highest sales ($8100)


def test_get_scenario(client):
    # Test valid scenario
    response = client.get("/api/v1/scenarios/Balanced")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["scenario_name"] == "Balanced"
    assert data["projected_sales_growth_pct"] == 12.0
    assert data["guardrails"]["private_brand_pass"] is True
    assert len(data["sku_actions"]) == 3

    # Test invalid scenario
    response = client.get("/api/v1/scenarios/Unknown")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_submission(client):
    # Test valid submission
    response = client.post("/api/v1/submissions", json={"scenario_name": "Balanced"})
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["scenario_name"] == "Balanced"
    assert data["submitted_by"] == "John Doe"
    assert data["status"] == "PENDING"
    assert "id" in data
    assert "audit_trail_id" in data

    # Test invalid scenario name
    response = client.post("/api/v1/submissions", json={"scenario_name": "Invalid"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_get_submission(client):
    # Create a submission first
    create_response = client.post(
        "/api/v1/submissions", json={"scenario_name": "Balanced"}
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    submission_id = create_response.json()["id"]

    # Fetch submission details
    response = client.get(f"/api/v1/submissions/{submission_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == submission_id
    assert data["scenario_name"] == "Balanced"
    assert len(data["sku_actions"]) == 3
    assert data["sku_actions"][0]["sku_id"] == "SKU-10045"

    # Test invalid submission ID
    response = client.get("/api/v1/submissions/non-existent-id")
    assert response.status_code == status.HTTP_404_NOT_FOUND
