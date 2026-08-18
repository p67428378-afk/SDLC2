def test_list_projects(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(p["name"] == "Default Project" for p in data)

def test_create_project_success(client):
    payload = {
        "name": "Website Redesign",
        "color_code": "#3B82F6"
    }
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Website Redesign"
    assert data["color_code"] == "#3B82F6"
    assert "id" in data

def test_create_project_duplicate_name(client):
    payload = {
        "name": "Website Redesign",
        "color_code": "#3B82F6"
    }
    client.post("/api/v1/projects", json=payload)
    
    # Try creating again with same name (case-insensitive)
    payload_dup = {
        "name": "website redesign",
        "color_code": "#1D4ED8"
    }
    response = client.post("/api/v1/projects", json=payload_dup)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_create_project_invalid_hex_color(client):
    payload = {
        "name": "Invalid Color Project",
        "color_code": "INVALID_HEX"
    }
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 422

def test_update_project(client):
    create_res = client.post("/api/v1/projects", json={"name": "Old Name", "color_code": "#10B981"})
    project_id = create_res.json()["id"]

    update_payload = {"name": "New Name", "color_code": "#059669"}
    response = client.put(f"/api/v1/projects/{project_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["color_code"] == "#059669"

def test_delete_project_without_entries(client):
    create_res = client.post("/api/v1/projects", json={"name": "Temp Project", "color_code": "#EF4444"})
    project_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/projects/{project_id}")
    assert get_res.status_code == 404

def test_delete_project_with_entries_fails(client):
    create_res = client.post("/api/v1/projects", json={"name": "Active Project", "color_code": "#F59E0B"})
    project_id = create_res.json()["id"]

    # Link time entry
    entry_payload = {
        "project_id": project_id,
        "duration_seconds": 1800,
        "description": "Working on active project",
        "entry_date": "2026-05-18"
    }
    entry_res = client.post("/api/v1/time-entries", json=entry_payload)
    assert entry_res.status_code == 201

    # Attempt deletion
    del_res = client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 400
    error_detail = del_res.json()["detail"]
    assert "Cannot delete project 'Active Project' because it has existing time entries linked to it." in error_detail
