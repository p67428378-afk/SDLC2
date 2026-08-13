def test_get_user_profile_default(client):
    # AC3: The theme preference must be fetched from the backend on initial load and applied immediately.
    # Verify that the default user profile is returned with default preferences (dark_mode=False).
    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6"
    assert data["email"] == "user@example.com"
    assert data["preferences"] is not None
    assert data["preferences"]["dark_mode"] is False


def test_update_user_preferences(client):
    # AC2: The selected theme preference must be saved to the user's profile in the database via a new API endpoint.
    # 1. Update dark_mode to True
    response = client.patch(
        "/api/v1/users/me/preferences",
        json={"dark_mode": True},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6"
    assert data["dark_mode"] is True
    assert "id" in data
    assert "updated_at" in data

    # 2. Verify the profile now returns dark_mode=True
    response_me = client.get("/api/v1/users/me")
    assert response_me.status_code == 200
    data_me = response_me.json()
    assert data_me["preferences"]["dark_mode"] is True


def test_unauthorized_access(client):
    # Verify that passing the mock unauthorized header returns 401 Unauthorized.
    headers = {"Authorization": "Bearer unauthorized"}

    # 1. Test GET /api/v1/users/me
    response_get = client.get("/api/v1/users/me", headers=headers)
    assert response_get.status_code == 401
    assert response_get.json()["detail"] == "Unauthorized"

    # 2. Test PATCH /api/v1/users/me/preferences
    response_patch = client.patch(
        "/api/v1/users/me/preferences",
        json={"dark_mode": True},
        headers=headers,
    )
    assert response_patch.status_code == 401
    assert response_patch.json()["detail"] == "Unauthorized"


def test_invalid_request_body(client):
    # Verify that invalid request body returns 422 Unprocessable Entity.
    response = client.patch(
        "/api/v1/users/me/preferences",
        json={"invalid_field": "value"},
    )
    assert response.status_code == 422
