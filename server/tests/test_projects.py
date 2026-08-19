from datetime import date


def test_list_projects(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # seeded projects exist


def test_create_project_success(client):
    payload = {"name": "Mobile App Redesign", "color_code": "#FF5733"}
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Mobile App Redesign"
    assert data["color_code"] == "#FF5733"
    assert "id" in data


def test_create_project_duplicate_name(client):
    # Website Redesign is already seeded or created
    payload = {"name": "Website Redesign", "color_code": "#123456"}
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_create_project_invalid_hex_color(client):
    payload = {"name": "Brand New Project", "color_code": "INVALID_HEX"}
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code in [400, 422]


def test_update_project(client):
    # First create a project
    create_res = client.post(
        "/api/v1/projects", json={"name": "Temp Project", "color_code": "#001122"}
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["id"]

    # Update project
    update_payload = {"name": "Temp Project Updated", "color_code": "#334455"}
    update_res = client.put(f"/api/v1/projects/{project_id}", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Temp Project Updated"


def test_update_project_not_found(client):
    response = client.put(
        "/api/v1/projects/non-existent-uuid", json={"name": "Ghost Project"}
    )
    assert response.status_code == 404


def test_delete_project_without_entries(client):
    create_res = client.post(
        "/api/v1/projects", json={"name": "Unused Project", "color_code": "#999999"}
    )
    project_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 204


def test_delete_project_with_linked_entries_fails(client):
    # Create project
    p_res = client.post(
        "/api/v1/projects", json={"name": "Linked Project", "color_code": "#AABBCC"}
    )
    project_id = p_res.json()["id"]

    # Create linked time entry
    entry_payload = {
        "project_id": project_id,
        "description": "Task for linked project",
        "duration_seconds": 1800,
        "entry_date": str(date.today()),
        "type": "manual",
    }
    e_res = client.post("/api/v1/time-entries", json=entry_payload)
    assert e_res.status_code == 201

    # Attempt delete
    del_res = client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 400
    assert "Cannot delete project" in del_res.json()["detail"]
    assert "existing time entries" in del_res.json()["detail"]
