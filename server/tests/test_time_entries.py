from datetime import date


def test_create_time_entry_success(client):
    # Fetch existing project
    projects_res = client.get("/api/v1/projects")
    project_id = projects_res.json()[0]["id"]

    payload = {
        "project_id": project_id,
        "description": "Backend API development",
        "duration_seconds": 3600,
        "entry_date": "2026-08-19",
        "type": "timer",
    }
    response = client.post("/api/v1/time-entries", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["project_id"] == project_id
    assert data["duration_seconds"] == 3600
    assert data["description"] == "Backend API development"


def test_create_time_entry_invalid_project(client):
    payload = {
        "project_id": "00000000-0000-0000-0000-000000000000",
        "description": "Orphan task",
        "duration_seconds": 1800,
        "entry_date": str(date.today()),
        "type": "manual",
    }
    response = client.post("/api/v1/time-entries", json=payload)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]


def test_list_time_entries(client):
    response = client.get("/api/v1/time-entries")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_daily_summary(client):
    # Create two projects
    p1 = client.post(
        "/api/v1/projects", json={"name": "Summary Proj 1", "color_code": "#111111"}
    ).json()
    p2 = client.post(
        "/api/v1/projects", json={"name": "Summary Proj 2", "color_code": "#222222"}
    ).json()

    test_date = "2026-10-10"

    # Add 2 hours (7200s) for P1 and 1.5 hours (5400s) for P2 on test_date
    client.post(
        "/api/v1/time-entries",
        json={
            "project_id": p1["id"],
            "description": "P1 Task 1",
            "duration_seconds": 7200,
            "entry_date": test_date,
            "type": "manual",
        },
    )
    client.post(
        "/api/v1/time-entries",
        json={
            "project_id": p2["id"],
            "description": "P2 Task 1",
            "duration_seconds": 5400,
            "entry_date": test_date,
            "type": "timer",
        },
    )

    # Query daily summary
    summary_res = client.get(
        f"/api/v1/time-entries/daily-summary?entry_date={test_date}"
    )
    assert summary_res.status_code == 200
    data = summary_res.json()

    assert data["entry_date"] == test_date
    assert data["total_duration_seconds"] == 12600  # 7200 + 5400 = 12600
    assert data["formatted_total"] == "3h 30m"  # 12600 / 3600 = 3h 30m

    proj_map = {p["project_id"]: p for p in data["projects"]}
    assert p1["id"] in proj_map
    assert proj_map[p1["id"]]["duration_seconds"] == 7200
    assert proj_map[p1["id"]]["formatted_duration"] == "2h 0m"

    assert p2["id"] in proj_map
    assert proj_map[p2["id"]]["duration_seconds"] == 5400
    assert proj_map[p2["id"]]["formatted_duration"] == "1h 30m"
