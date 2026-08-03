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


def test_get_mfa_code_success(client):
    response = client.get("/api/v1/auth/mfa-code?email=test@example.com")
    assert response.status_code == 200
    data = response.json()
    assert "code" in data
    code = data["code"]
    assert len(code) == 6
    assert code.isdigit()


def test_get_mfa_code_user_not_found(client):
    response = client.get("/api/v1/auth/mfa-code?email=nonexistent@example.com")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found for this email"


def test_get_mfa_code_missing_email(client):
    response = client.get("/api/v1/auth/mfa-code")
    assert response.status_code == 400
    assert response.json()["detail"] == "Email parameter is required"


def test_dev_mfa_code_html_success(client):
    response = client.get("/api/v1/dev/mfa-code?email=test@example.com")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    html = response.text
    assert "Your MFA Code" in html
    assert "Copy to Clipboard" in html


def test_dev_mfa_code_html_user_not_found(client):
    response = client.get("/api/v1/dev/mfa-code?email=nonexistent@example.com")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "User not found for this email" in response.text


def test_verify_mfa_success(client):
    # First login to get mfa_token
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_response.json()["mfa_token"]

    # Request code
    code_response = client.get("/api/v1/auth/mfa-code?email=test@example.com")
    code = code_response.json()["code"]

    # Verify MFA with real generated code
    response = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": code}
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

    # Generate a code first so store is populated
    client.get("/api/v1/auth/mfa-code?email=test@example.com")

    response = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": "999999"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid MFA code"


def test_verify_mfa_rate_limit(client):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_response.json()["mfa_token"]

    # Request code to create entry in store
    code_response = client.get("/api/v1/auth/mfa-code?email=test@example.com")
    correct_code = code_response.json()["code"]
    wrong_code = "000000" if correct_code != "000000" else "111111"

    # Attempt 1
    resp1 = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": wrong_code}
    )
    assert resp1.status_code == 400

    # Attempt 2
    resp2 = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": wrong_code}
    )
    assert resp2.status_code == 400

    # Attempt 3 (rate limited)
    resp3 = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": wrong_code}
    )
    assert resp3.status_code == 429
    assert (
        resp3.json()["detail"]
        == "Maximum MFA verification attempts exceeded. Please request a new code."
    )


def test_verify_mfa_invalid_token(client):
    response = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": "invalidtoken", "code": "123456"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired MFA token"
