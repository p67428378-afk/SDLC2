from fastapi.testclient import TestClient


def test_dummy_login_success_with_testuser(client: TestClient):
    # AC: Customer can authenticate with dummy credentials
    response = client.post(
        "/auth/dummy-login", json={"username": "testuser", "password": "password"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_dummy_login_success_with_seeded_user(client: TestClient):
    # AC: Customer can authenticate with seeded credentials
    response = client.post(
        "/auth/dummy-login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_dummy_login_failure_invalid_credentials(client: TestClient):
    # AC: Invalid credentials return 401
    response = client.post(
        "/auth/dummy-login",
        json={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"
