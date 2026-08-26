def test_list_projects_employee(client, employee_token, test_project, inactive_project):
    # AC 2: Employees can view active projects
    response = client.get(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    project_ids = [p["id"] for p in data]
    assert test_project.id in project_ids
    assert inactive_project.id not in project_ids


def test_manager_can_create_project(client, manager_token):
    # AC 2: Manager creates a project successfully
    response = client.post(
        "/api/v1/projects",
        json={
            "name": "Gamma Project",
            "description": "High priority initiative",
            "active_status": True,
        },
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Gamma Project"
    assert data["active_status"] is True
    assert "id" in data


def test_employee_cannot_create_project(client, employee_token):
    # AC 2: Employee attempting to create a project receives 403 Forbidden
    response = client.post(
        "/api/v1/projects",
        json={
            "name": "Unauthorized Project",
            "description": "Should fail",
            "active_status": True,
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert response.status_code == 403


def test_manager_can_update_project(client, manager_token, test_project):
    # AC 2: Manager updates project details
    response = client.put(
        f"/api/v1/projects/{test_project.id}",
        json={"name": "Updated Project Name", "active_status": True},
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Project Name"


def test_employee_cannot_update_project(client, employee_token, test_project):
    # AC 2: Employee cannot update project (403 Forbidden)
    response = client.put(
        f"/api/v1/projects/{test_project.id}",
        json={"name": "Hacked Name"},
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert response.status_code == 403


def test_manager_can_delete_project(client, manager_token, test_project):
    # AC 2: Manager deactivates project (204 No Content)
    response = client.delete(
        f"/api/v1/projects/{test_project.id}",
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert response.status_code == 204


def test_employee_cannot_delete_project(client, employee_token, test_project):
    # AC 2: Employee cannot delete project (403 Forbidden)
    response = client.delete(
        f"/api/v1/projects/{test_project.id}",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert response.status_code == 403
