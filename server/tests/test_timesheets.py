from datetime import date, timedelta


def test_employee_can_create_timesheet_entry(client, employee_token, test_project):
    # AC 3: Employee logs hours against an active project (status is pending)
    today_str = date.today().isoformat()
    response = client.post(
        "/api/v1/timesheets",
        json={
            "project_id": test_project.id,
            "date": today_str,
            "hours_worked": 8.0,
            "description": "Implemented feature A",
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["hours_worked"] == 8.0
    assert data["project_id"] == test_project.id


def test_cannot_log_hours_on_inactive_project(client, employee_token, inactive_project):
    # AC 3: Inactive project rejects timesheet creation with 400 Bad Request
    today_str = date.today().isoformat()
    response = client.post(
        "/api/v1/timesheets",
        json={
            "project_id": inactive_project.id,
            "date": today_str,
            "hours_worked": 4.0,
            "description": "Attempt on inactive project",
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert response.status_code == 400
    assert "inactive project" in response.json()["detail"].lower()


def test_employee_can_update_pending_entry(client, employee_token, test_project):
    # AC 3: Employee can update their own pending timesheet entry
    today_str = date.today().isoformat()
    create_res = client.post(
        "/api/v1/timesheets",
        json={
            "project_id": test_project.id,
            "date": today_str,
            "hours_worked": 6.0,
            "description": "Initial draft",
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    entry_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/timesheets/{entry_id}",
        json={
            "hours_worked": 7.5,
            "description": "Updated hours and task details",
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["hours_worked"] == 7.5
    assert update_res.json()["description"] == "Updated hours and task details"


def test_employee_can_delete_pending_entry(client, employee_token, test_project):
    # AC 3: Employee can delete their own pending timesheet entry
    today_str = date.today().isoformat()
    create_res = client.post(
        "/api/v1/timesheets",
        json={
            "project_id": test_project.id,
            "date": today_str,
            "hours_worked": 2.0,
            "description": "To be deleted",
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    entry_id = create_res.json()["id"]

    del_res = client.delete(
        f"/api/v1/timesheets/{entry_id}",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert del_res.status_code == 204


def test_manager_can_approve_timesheet(
    client, employee_token, manager_token, test_project
):
    # AC 3: Manager approves timesheet entry
    today_str = date.today().isoformat()
    create_res = client.post(
        "/api/v1/timesheets",
        json={
            "project_id": test_project.id,
            "date": today_str,
            "hours_worked": 8.0,
            "description": "Completed milestone",
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    entry_id = create_res.json()["id"]

    approve_res = client.put(
        f"/api/v1/timesheets/{entry_id}/approve",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"


def test_cannot_edit_approved_entry(
    client, employee_token, manager_token, test_project
):
    # AC 3: Cannot edit or delete non-pending timesheet entry (400 Bad Request)
    today_str = date.today().isoformat()
    create_res = client.post(
        "/api/v1/timesheets",
        json={
            "project_id": test_project.id,
            "date": today_str,
            "hours_worked": 8.0,
            "description": "Approved task",
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    entry_id = create_res.json()["id"]

    # Approve entry
    client.put(
        f"/api/v1/timesheets/{entry_id}/approve",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {manager_token}"},
    )

    # Attempt edit
    edit_res = client.put(
        f"/api/v1/timesheets/{entry_id}",
        json={"hours_worked": 10.0},
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert edit_res.status_code == 400

    # Attempt delete
    del_res = client.delete(
        f"/api/v1/timesheets/{entry_id}",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert del_res.status_code == 400


def test_manager_bulk_approve(client, employee_token, manager_token, test_project):
    # AC 3: Manager bulk approve multiple entries
    today_str = date.today().isoformat()
    res1 = client.post(
        "/api/v1/timesheets",
        json={"project_id": test_project.id, "date": today_str, "hours_worked": 4.0},
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    res2 = client.post(
        "/api/v1/timesheets",
        json={"project_id": test_project.id, "date": today_str, "hours_worked": 4.0},
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    id1 = res1.json()["id"]
    id2 = res2.json()["id"]

    bulk_res = client.put(
        "/api/v1/timesheets/bulk-approve",
        json={"entry_ids": [id1, id2], "status": "approved"},
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert bulk_res.status_code == 200
    data = bulk_res.json()
    assert len(data) == 2
    for item in data:
        assert item["status"] == "approved"


def test_timesheet_summary_endpoint(client, employee_token, test_project):
    # AC 4: Weekly & Monthly aggregation summary returns total hours
    today = date.today()
    client.post(
        "/api/v1/timesheets",
        json={
            "project_id": test_project.id,
            "date": today.isoformat(),
            "hours_worked": 5.5,
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    client.post(
        "/api/v1/timesheets",
        json={
            "project_id": test_project.id,
            "date": (today - timedelta(days=1)).isoformat(),
            "hours_worked": 4.5,
        },
        headers={"Authorization": f"Bearer {employee_token}"},
    )

    summary_res = client.get(
        "/api/v1/timesheets/summary?timeframe=weekly",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["total_hours"] >= 10.0
    assert len(summary_data["items"]) > 0


def test_timesheet_summary_empty_range(client, employee_token):
    # AC 4: Summary for date ranges with no entries returns 0 hours gracefully
    past_date = (date.today() - timedelta(days=365)).isoformat()
    summary_res = client.get(
        f"/api/v1/timesheets/summary?timeframe=weekly&start_date={past_date}&end_date={past_date}",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["total_hours"] == 0.0
    assert summary_data["items"] == []
