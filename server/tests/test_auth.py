def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "mfa_token" in data
    assert data["message"] == "MFA code required"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_verify_mfa_success(client):
    # First login to get mfa_token
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_response.json()["mfa_token"]

    # Verify MFA
    response = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": "123456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_verify_mfa_invalid_code(client):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_response.json()["mfa_token"]

    response = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": "wrongcode"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid MFA code"


def test_verify_mfa_invalid_token(client):
    response = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": "invalidtoken", "code": "123456"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired MFA token"
