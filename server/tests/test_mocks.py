from fastapi.testclient import TestClient


def test_mock_config_success(client: TestClient):
    response = client.post("/api/v1/mock/config", json={"scenario": "no accounts"})
    assert response.status_code == 200
    assert response.json()["scenario"] == "no accounts"
    assert response.json()["status"] == "configured"

    # Reset to default
    client.post("/api/v1/mock/config", json={"scenario": "default"})


def test_mock_config_invalid(client: TestClient):
    response = client.post("/api/v1/mock/config", json={"scenario": "invalid-scenario"})
    assert response.status_code == 400


def test_get_fiserv_accounts_success(client: TestClient):
    response = client.get("/api/v1/mock/fiserv/accounts/CIF-98421")
    assert response.status_code == 200
    data = response.json()
    assert data["cifId"] == "CIF-98421"
    assert len(data["accounts"]) == 3
    assert data["accounts"][0]["type"] == "Savings"


def test_get_cenlar_mortgages_success(client: TestClient):
    response = client.get("/api/v1/mock/cenlar/mortgages/CEN-55102")
    assert response.status_code == 200
    data = response.json()
    assert data["customerId"] == "CEN-55102"
    assert len(data["mortgages"]) == 1
    assert data["mortgages"][0]["balance"] == 230000.00
