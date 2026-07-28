from fastapi.testclient import TestClient


def test_login_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "mfa_token" in data
    assert data["message"] == "MFA code sent. Please verify."


def test_login_invalid_credentials(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_mfa_verify_success(client: TestClient):
    # First login to get MFA token
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_response.json()["mfa_token"]

    # Verify MFA code
    verify_response = client.post(
        "/api/v1/auth/mfa/verify", json={"code": "000000", "mfa_token": mfa_token}
    )
    assert verify_response.status_code == 200
    data = verify_response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "test@example.com"


def test_mfa_verify_invalid_code(client: TestClient):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_response.json()["mfa_token"]

    verify_response = client.post(
        "/api/v1/auth/mfa/verify", json={"code": "123456", "mfa_token": mfa_token}
    )
    assert verify_response.status_code == 401
    assert verify_response.json()["detail"] == "Invalid or expired MFA code"
