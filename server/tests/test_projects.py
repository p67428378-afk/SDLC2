def test_create_project_success(client):
    response = client.post(
        "/api/v1/projects",
        json={"name": "Website Redesign", "color_code": "#3B82F6"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Website Redesign"
    assert data["color_code"] == "#3B82F6"
    assert "id" in data


def test_create_project_duplicate_name(client):
    client.post(
        "/api/v1/projects",
        json={"name": "Internal Admin", "color_code": "#6B7280"},
    )
    response = client.post(
        "/api/v1/projects",
        json={"name": "internal admin", "color_code": "#123456"},
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_create_project_invalid_hex_color(client):
    response = client.post(
        "/api/v1/projects",
        json={"name": "Mobile App", "color_code": "INVALID_COLOR"},
    )
    assert response.status_code == 422


def test_list_projects(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_update_project(client):
    create_res = client.post(
        "/api/v1/projects",
        json={"name": "Client Work", "color_code": "#10B981"},
    )
    proj_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/projects/{proj_id}",
        json={"name": "Client Work Updated", "color_code": "#059669"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Client Work Updated"


def test_delete_project_without_entries(client):
    create_res = client.post(
        "/api/v1/projects",
        json={"name": "Temporary Proj", "color_code": "#F59E0B"},
    )
    proj_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/projects/{proj_id}")
    assert del_res.status_code == 204


def test_delete_project_with_entries_blocked(client):
    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Active Proj With Entries", "color_code": "#EC4899"},
    )
    proj_id = proj_res.json()["id"]

    # Add a time entry
    entry_res = client.post(
        "/api/v1/time-entries",
        json={
            "project_id": proj_id,
            "duration_seconds": 1800,
            "description": "Coding session",
            "entry_date": "2026-05-18",
        },
    )
    assert entry_res.status_code == 201

    # Attempt delete
    del_res = client.delete(f"/api/v1/projects/{proj_id}")
    assert del_res.status_code == 400
    assert "Cannot delete project" in del_res.json()["detail"]
    assert "has existing time entries linked to it" in del_res.json()["detail"]
