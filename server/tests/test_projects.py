from fastapi.testclient import TestClient
from server.models import Project


def test_manager_create_project(client: TestClient, manager_headers: dict[str, str]):
    response = client.post(
        "/api/v1/projects",
        headers=manager_headers,
        json={
            "name": "Timesheet V2",
            "description": "Next generation timesheets",
            "active_status": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Timesheet V2"
    assert data["description"] == "Next generation timesheets"
    assert data["active_status"] is True
    assert "id" in data


def test_employee_create_project_forbidden(
    client: TestClient, employee_headers: dict[str, str]
):
    response = client.post(
        "/api/v1/projects",
        headers=employee_headers,
        json={
            "name": "Unauthorized Project",
            "description": "Employee cannot create",
            "active_status": True,
        },
    )
    assert response.status_code == 403


def test_list_projects_employee_active_only(
    client: TestClient,
    employee_headers: dict[str, str],
    active_project: Project,
    inactive_project: Project,
):
    response = client.get("/api/v1/projects", headers=employee_headers)
    assert response.status_code == 200
    data = response.json()
    # Employee must only see active projects
    project_ids = [p["id"] for p in data]
    assert active_project.id in project_ids
    assert inactive_project.id not in project_ids


def test_list_projects_manager_all(
    client: TestClient,
    manager_headers: dict[str, str],
    active_project: Project,
    inactive_project: Project,
):
    response = client.get("/api/v1/projects", headers=manager_headers)
    assert response.status_code == 200
    data = response.json()
    project_ids = [p["id"] for p in data]
    assert active_project.id in project_ids
    assert inactive_project.id in project_ids


def test_manager_update_project(
    client: TestClient,
    manager_headers: dict[str, str],
    active_project: Project,
):
    response = client.put(
        f"/api/v1/projects/{active_project.id}",
        headers=manager_headers,
        json={"name": "Active Project Renamed", "active_status": False},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Active Project Renamed"
    assert data["active_status"] is False


def test_employee_update_project_forbidden(
    client: TestClient,
    employee_headers: dict[str, str],
    active_project: Project,
):
    response = client.put(
        f"/api/v1/projects/{active_project.id}",
        headers=employee_headers,
        json={"name": "Hacked Name"},
    )
    assert response.status_code == 403


def test_manager_delete_project(
    client: TestClient,
    manager_headers: dict[str, str],
    active_project: Project,
):
    response = client.delete(
        f"/api/v1/projects/{active_project.id}",
        headers=manager_headers,
    )
    assert response.status_code == 204

    # Verify deleted
    get_res = client.get(
        f"/api/v1/projects/{active_project.id}", headers=manager_headers
    )
    assert get_res.status_code == 404


def test_get_nonexistent_project(client: TestClient, manager_headers: dict[str, str]):
    response = client.get("/api/v1/projects/non-existent-uuid", headers=manager_headers)
    assert response.status_code == 404
