def test_login_success(client, test_user):
    # AC-B1: Secure User Authentication - Happy path login
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    assert "mfa_token" in response.json()
    assert "message" in response.json()


def test_login_invalid_credentials(client, test_user):
    # AC-B1: Secure User Authentication - Invalid credentials
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_mfa_verify_success(client, test_user):
    # AC-B1: Secure User Authentication - Happy path MFA verification
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_res.json()["mfa_token"]

    response = client.post(
        "/api/v1/auth/mfa/verify", json={"code": "123456", "mfa_token": mfa_token}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"
    assert response.json()["user"]["username"] == "test@example.com"


def test_mfa_verify_invalid_code(client, test_user):
    # AC-B1: Secure User Authentication - Invalid MFA code
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_res.json()["mfa_token"]

    response = client.post(
        "/api/v1/auth/mfa/verify", json={"code": "000000", "mfa_token": mfa_token}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired mfa code"
