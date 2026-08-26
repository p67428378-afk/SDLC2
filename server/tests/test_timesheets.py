from datetime import date, timedelta
from fastapi.testclient import TestClient
from server.models import Project


def test_create_timesheet_success(
    client: TestClient,
    employee_headers: dict[str, str],
    active_project: Project,
):
    response = client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(date.today()),
            "hours_worked": 8.0,
            "description": "Implemented FastAPI endpoints",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["project_id"] == active_project.id
    assert data["hours_worked"] == 8.0
    assert data["status"] == "pending"
    assert "id" in data


def test_create_timesheet_inactive_project_fails(
    client: TestClient,
    employee_headers: dict[str, str],
    inactive_project: Project,
):
    response = client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": inactive_project.id,
            "date": str(date.today()),
            "hours_worked": 4.0,
            "description": "Attempted work on inactive project",
        },
    )
    assert response.status_code == 400
    assert "inactive project" in response.json()["detail"]


def test_create_timesheet_invalid_hours(
    client: TestClient,
    employee_headers: dict[str, str],
    active_project: Project,
):
    # Hours > 24
    res1 = client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(date.today()),
            "hours_worked": 25.0,
            "description": "Impossible hours",
        },
    )
    assert res1.status_code == 422

    # Hours <= 0
    res2 = client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(date.today()),
            "hours_worked": 0.0,
            "description": "Zero hours",
        },
    )
    assert res2.status_code == 422


def test_edit_pending_timesheet(
    client: TestClient,
    employee_headers: dict[str, str],
    active_project: Project,
):
    create_res = client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(date.today()),
            "hours_worked": 6.0,
            "description": "Initial task description",
        },
    )
    timesheet_id = create_res.json()["id"]

    edit_res = client.put(
        f"/api/v1/timesheets/{timesheet_id}",
        headers=employee_headers,
        json={
            "hours_worked": 7.5,
            "description": "Updated task description",
        },
    )
    assert edit_res.status_code == 200
    data = edit_res.json()
    assert data["hours_worked"] == 7.5
    assert data["description"] == "Updated task description"


def test_delete_pending_timesheet(
    client: TestClient,
    employee_headers: dict[str, str],
    active_project: Project,
):
    create_res = client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(date.today()),
            "hours_worked": 3.0,
            "description": "Temporary entry",
        },
    )
    timesheet_id = create_res.json()["id"]

    del_res = client.delete(
        f"/api/v1/timesheets/{timesheet_id}", headers=employee_headers
    )
    assert del_res.status_code == 204


def test_manager_approve_timesheet(
    client: TestClient,
    employee_headers: dict[str, str],
    manager_headers: dict[str, str],
    active_project: Project,
):
    create_res = client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(date.today()),
            "hours_worked": 8.0,
            "description": "Work to be approved",
        },
    )
    timesheet_id = create_res.json()["id"]

    # Manager approves
    app_res = client.put(
        f"/api/v1/timesheets/{timesheet_id}/approve",
        headers=manager_headers,
        json={"status": "approved"},
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"

    # Employee edit attempt after approval must return 400
    edit_res = client.put(
        f"/api/v1/timesheets/{timesheet_id}",
        headers=employee_headers,
        json={"hours_worked": 9.0},
    )
    assert edit_res.status_code == 400

    # Employee delete attempt after approval must return 400
    del_res = client.delete(
        f"/api/v1/timesheets/{timesheet_id}", headers=employee_headers
    )
    assert del_res.status_code == 400


def test_employee_approve_timesheet_forbidden(
    client: TestClient,
    employee_headers: dict[str, str],
    active_project: Project,
):
    create_res = client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(date.today()),
            "hours_worked": 8.0,
            "description": "Self approval test",
        },
    )
    timesheet_id = create_res.json()["id"]

    app_res = client.put(
        f"/api/v1/timesheets/{timesheet_id}/approve",
        headers=employee_headers,
        json={"status": "approved"},
    )
    assert app_res.status_code == 403


def test_bulk_approve_timesheets(
    client: TestClient,
    employee_headers: dict[str, str],
    manager_headers: dict[str, str],
    active_project: Project,
):
    ids = []
    for d in range(3):
        res = client.post(
            "/api/v1/timesheets",
            headers=employee_headers,
            json={
                "project_id": active_project.id,
                "date": str(date.today() - timedelta(days=d)),
                "hours_worked": 8.0,
                "description": f"Day {d} work",
            },
        )
        ids.append(res.json()["id"])

    bulk_res = client.put(
        "/api/v1/timesheets/bulk-approve",
        headers=manager_headers,
        json={"entry_ids": ids, "status": "approved"},
    )
    assert bulk_res.status_code == 200
    assert bulk_res.json()["updated_count"] == 3
    assert bulk_res.json()["status"] == "approved"


def test_timesheet_summary(
    client: TestClient,
    employee_headers: dict[str, str],
    active_project: Project,
):
    today = date.today()
    client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(today),
            "hours_worked": 8.0,
            "description": "Day 1",
        },
    )
    client.post(
        "/api/v1/timesheets",
        headers=employee_headers,
        json={
            "project_id": active_project.id,
            "date": str(today),
            "hours_worked": 4.5,
            "description": "Day 2",
        },
    )

    res = client.get(
        f"/api/v1/timesheets/summary?start_date={today - timedelta(days=7)}&end_date={today + timedelta(days=1)}",
        headers=employee_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_hours"] >= 12.5
    assert "by_project" in data
    assert "by_status" in data
    assert data["by_status"]["pending"] >= 12.5
