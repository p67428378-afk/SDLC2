def test_register_employee_success(client):
    # AC 1: User registration for Employee role
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newemployee@example.com",
            "password": "securepassword",
            "role": "Employee",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newemployee@example.com"
    assert data["role"] == "Employee"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client, employee_user):
    # AC 1: Duplicate registration rejected with 400 Bad Request
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": employee_user.email,
            "password": "anotherpassword",
            "role": "Employee",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client, employee_user):
    # AC 1: User login issuing JWT token
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": employee_user.email,
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client, employee_user):
    # AC 1: Invalid login rejected with 401 Unauthorized
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": employee_user.email,
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "incorrect email or password" in response.json()["detail"].lower()


def test_get_current_user_profile(client, employee_token, employee_user):
    # AC 1: Profile retrieval for authenticated user
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == employee_user.id
    assert data["email"] == employee_user.email
    assert data["role"] == "Employee"


def test_unauthenticated_request_rejected(client):
    # AC 1: Unauthenticated request rejected with 401 Unauthorized
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
