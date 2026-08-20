def test_create_and_get_project(client):
    response = client.post(
        "/api/v1/projects", json={"name": "Website Redesign", "color_code": "#3B82F6"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Website Redesign"
    assert data["color_code"] == "#3B82F6"
    assert "id" in data

    # Get list
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 1
    assert any(p["name"] == "Website Redesign" for p in projects)


def test_duplicate_project_name_rejected(client):
    client.post(
        "/api/v1/projects", json={"name": "Internal Admin", "color_code": "#6B7280"}
    )
    response = client.post(
        "/api/v1/projects", json={"name": "Internal Admin", "color_code": "#10B981"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_invalid_color_code_rejected(client):
    response = client.post(
        "/api/v1/projects", json={"name": "Invalid Color", "color_code": "blue"}
    )
    assert response.status_code in (400, 422)


def test_update_project(client):
    create_res = client.post(
        "/api/v1/projects", json={"name": "Old Name", "color_code": "#111111"}
    )
    proj_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/projects/{proj_id}",
        json={"name": "New Name", "color_code": "#222222"},
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "New Name"
    assert data["color_code"] == "#222222"


def test_delete_project_without_entries(client):
    create_res = client.post(
        "/api/v1/projects", json={"name": "Temporary Project", "color_code": "#999999"}
    )
    proj_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/projects/{proj_id}")
    assert del_res.status_code == 204


def test_delete_project_with_entries_rejected(client):
    create_res = client.post(
        "/api/v1/projects", json={"name": "Locked Project", "color_code": "#FF0000"}
    )
    proj_id = create_res.json()["id"]

    # Create time entry linked to project
    entry_res = client.post(
        "/api/v1/time-entries",
        json={
            "project_id": proj_id,
            "duration_seconds": 3600,
            "description": "Task 1",
            "entry_date": "2026-05-18",
        },
    )
    assert entry_res.status_code == 201

    # Attempt deletion
    del_res = client.delete(f"/api/v1/projects/{proj_id}")
    assert del_res.status_code == 400
    assert "Cannot delete project" in del_res.json()["detail"]
    assert "has existing time entries linked to it" in del_res.json()["detail"]
