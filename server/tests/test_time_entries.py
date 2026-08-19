def test_create_time_entry_success(client):
    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Sprint Planning", "color_code": "#3B82F6"},
    )
    proj_id = proj_res.json()["id"]

    res = client.post(
        "/api/v1/time-entries",
        json={
            "project_id": proj_id,
            "duration_seconds": 3600,
            "description": "Sprint planning meeting",
            "entry_date": "2026-05-18",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["project_id"] == proj_id
    assert data["duration_seconds"] == 3600
    assert data["entry_date"] == "2026-05-18"


def test_create_time_entry_missing_project(client):
    res = client.post(
        "/api/v1/time-entries",
        json={
            "project_id": "non-existent-uuid",
            "duration_seconds": 1800,
            "entry_date": "2026-05-18",
        },
    )
    assert res.status_code == 400
    assert "Invalid project_id provided." in res.json()["detail"]


def test_daily_summary_grouped_by_project(client):
    # Create two projects
    p1 = client.post(
        "/api/v1/projects",
        json={"name": "Frontend Dev", "color_code": "#3B82F6"},
    ).json()
    p2 = client.post(
        "/api/v1/projects",
        json={"name": "Backend Dev", "color_code": "#10B981"},
    ).json()

    target_date = "2026-05-18"

    # Log 3h 15m (11700s) on Frontend
    client.post(
        "/api/v1/time-entries",
        json={
            "project_id": p1["id"],
            "duration_seconds": 11700,
            "description": "React UI work",
            "entry_date": target_date,
        },
    )

    # Log 1h 0m (3600s) on Backend
    client.post(
        "/api/v1/time-entries",
        json={
            "project_id": p2["id"],
            "duration_seconds": 3600,
            "description": "API endpoints",
            "entry_date": target_date,
        },
    )

    res = client.get(f"/api/v1/time-entries/daily-summary?date={target_date}")
    assert res.status_code == 200
    data = res.json()

    assert data["date"] == target_date
    assert data["total_duration_seconds"] == 15300  # 4h 15m
    assert data["formatted_total"] == "4h 15m"

    assert len(data["projects"]) >= 2
    # Verify p1 summary
    p1_summary = next((p for p in data["projects"] if p["project_id"] == p1["id"]), None)
    assert p1_summary is not None
    assert p1_summary["project_name"] == "Frontend Dev"
    assert p1_summary["color_code"] == "#3B82F6"
    assert p1_summary["total_duration_seconds"] == 11700
    assert p1_summary["formatted_duration"] == "3h 15m"
    assert p1_summary["entries_count"] == 1

    # Verify p2 summary
    p2_summary = next((p for p in data["projects"] if p["project_id"] == p2["id"]), None)
    assert p2_summary is not None
    assert p2_summary["project_name"] == "Backend Dev"
    assert p2_summary["color_code"] == "#10B981"
    assert p2_summary["total_duration_seconds"] == 3600
    assert p2_summary["formatted_duration"] == "1h 0m"
    assert p2_summary["entries_count"] == 1
