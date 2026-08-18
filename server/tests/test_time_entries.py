from datetime import date

def test_create_time_entry_success(client):
    proj_res = client.post("/api/v1/projects", json={"name": "Client Work", "color_code": "#3B82F6"})
    proj_id = proj_res.json()["id"]

    payload = {
        "project_id": proj_id,
        "duration_seconds": 3600,
        "description": "Initial design review",
        "entry_date": "2026-05-18"
    }
    response = client.post("/api/v1/time-entries", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["project_id"] == proj_id
    assert data["duration_seconds"] == 3600
    assert data["description"] == "Initial design review"
    assert data["entry_date"] == "2026-05-18"
    assert data["project"]["name"] == "Client Work"

def test_create_time_entry_missing_project_id(client):
    payload = {
        "project_id": "   ",
        "duration_seconds": 1800,
        "description": "No project selected"
    }
    response = client.post("/api/v1/time-entries", json=payload)
    assert response.status_code == 400
    assert "mandatory" in response.json()["detail"].lower()

def test_create_time_entry_invalid_project_id(client):
    payload = {
        "project_id": "00000000-0000-0000-0000-000000000000",
        "duration_seconds": 1800,
        "description": "Non-existent project"
    }
    response = client.post("/api/v1/time-entries", json=payload)
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()

def test_daily_summary_aggregation(client):
    target_date = "2026-05-18"

    # Create 2 projects
    p1 = client.post("/api/v1/projects", json={"name": "Website Redesign", "color_code": "#3B82F6"}).json()
    p2 = client.post("/api/v1/projects", json={"name": "Internal Admin", "color_code": "#6B7280"}).json()

    # Create entries for p1 (3600s + 8100s = 11700s -> 3h 15m)
    client.post("/api/v1/time-entries", json={
        "project_id": p1["id"],
        "duration_seconds": 3600,
        "description": "Entry 1",
        "entry_date": target_date
    })
    client.post("/api/v1/time-entries", json={
        "project_id": p1["id"],
        "duration_seconds": 8100,
        "description": "Entry 2",
        "entry_date": target_date
    })

    # Create entry for p2 (3600s -> 1h 0m)
    client.post("/api/v1/time-entries", json={
        "project_id": p2["id"],
        "duration_seconds": 3600,
        "description": "Admin task",
        "entry_date": target_date
    })

    # Total duration = 11700 + 3600 = 15300s -> 4h 15m
    res = client.get(f"/api/v1/time-entries/daily-summary?date={target_date}")
    assert res.status_code == 200
    data = res.json()

    assert data["date"] == target_date
    assert data["total_duration_seconds"] == 15300
    assert data["formatted_total"] == "4h 15m"
    assert len(data["projects"]) == 2

    p1_summary = next(p for p in data["projects"] if p["project_id"] == p1["id"])
    assert p1_summary["project_name"] == "Website Redesign"
    assert p1_summary["color_code"] == "#3B82F6"
    assert p1_summary["total_duration_seconds"] == 11700
    assert p1_summary["formatted_duration"] == "3h 15m"
    assert p1_summary["entries_count"] == 2

    p2_summary = next(p for p in data["projects"] if p["project_id"] == p2["id"])
    assert p2_summary["project_name"] == "Internal Admin"
    assert p2_summary["color_code"] == "#6B7280"
    assert p2_summary["total_duration_seconds"] == 3600
    assert p2_summary["formatted_duration"] == "1h 0m"
    assert p2_summary["entries_count"] == 1
