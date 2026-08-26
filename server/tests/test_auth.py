from fastapi.testclient import TestClient


def test_register_employee_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new_employee@example.com",
            "password": "Password123!",
            "role": "Employee",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new_employee@example.com"
    assert data["role"] == "Employee"
    assert "id" in data


def test_register_manager_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new_manager@example.com",
            "password": "Password123!",
            "role": "Manager",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new_manager@example.com"
    assert data["role"] == "Manager"


def test_register_duplicate_email(client: TestClient):
    payload = {
        "email": "dup@example.com",
        "password": "Password123!",
        "role": "Employee",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"]


def test_login_success(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login_user@example.com",
            "password": "ValidPassword123",
            "role": "Employee",
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "login_user@example.com", "password": "ValidPassword123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login_user@example.com"
    assert data["user"]["role"] == "Employee"


def test_login_invalid_password(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong_pwd@example.com",
            "password": "ValidPassword123",
            "role": "Employee",
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong_pwd@example.com", "password": "WrongPassword"},
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_login_nonexistent_user(client: TestClient):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "Password123"},
    )
    assert res.status_code == 401


def test_auth_me_endpoint(client: TestClient, employee_headers: dict[str, str]):
    res = client.get("/api/v1/auth/me", headers=employee_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test_emp@example.com"
    assert data["role"] == "Employee"


def test_auth_me_unauthorized(client: TestClient):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
