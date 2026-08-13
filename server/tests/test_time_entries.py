from datetime import datetime, timezone, timedelta


def test_start_and_stop_timer(client):
    # AC: The user can start a single, simple timer to begin tracking work and stop it to pause.
    # The system will record the total elapsed time for the day.
    started_at = datetime.now(timezone.utc) - timedelta(hours=1)
    ended_at = datetime.now(timezone.utc)

    response = client.post(
        "/api/v1/time-entries",
        json={
            "type": "timed",
            "description": "Coding session",
            "started_at": started_at.isoformat(),
            "ended_at": ended_at.isoformat(),
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "timed"
    assert data["description"] == "Coding session"
    assert data["duration_seconds"] == 3600


def test_start_and_stop_timer_lifecycle(client):
    # AC: The user can start a single, simple timer to begin tracking work and stop it to pause.
    # 1. Start the timer (ended_at is None)
    started_at = datetime.now(timezone.utc) - timedelta(minutes=30)
    response = client.post(
        "/api/v1/time-entries",
        json={
            "type": "timed",
            "description": "Running timer",
            "started_at": started_at.isoformat(),
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "timed"
    assert data["ended_at"] is None
    assert data["duration_seconds"] == 0

    # 2. Stop the timer (ended_at is set)
    ended_at = datetime.now(timezone.utc)
    response_stop = client.post(
        "/api/v1/time-entries", json={"type": "timed", "ended_at": ended_at.isoformat()}
    )
    assert response_stop.status_code == 201
    data_stop = response_stop.json()
    assert data_stop["type"] == "timed"
    assert data_stop["ended_at"] is not None
    assert data_stop["duration_seconds"] >= 1800  # 30 minutes


def test_timer_invalid_dates(client):
    # AC: The user can start a single, simple timer to begin tracking work and stop it to pause.
    # Edge case: ended_at is before started_at.
    started_at = datetime.now(timezone.utc)
    ended_at = datetime.now(timezone.utc) - timedelta(hours=1)

    response = client.post(
        "/api/v1/time-entries",
        json={
            "type": "timed",
            "description": "Invalid timer",
            "started_at": started_at.isoformat(),
            "ended_at": ended_at.isoformat(),
        },
    )
    assert response.status_code == 400
    assert "ended_at cannot be before started_at" in response.json()["detail"]


def test_add_manual_time_entry_with_string(client):
    # AC: The user can manually add a block of time to their daily total without using the automatic timer.
    response = client.post(
        "/api/v1/time-entries",
        json={"type": "manual", "description": "Meeting", "duration_string": "1h 30m"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "manual"
    assert data["duration_seconds"] == 5400


def test_add_manual_time_entry_with_seconds(client):
    # AC: The user can manually add a block of time to their daily total without using the automatic timer.
    response = client.post(
        "/api/v1/time-entries",
        json={
            "type": "manual",
            "description": "Reviewing PRs",
            "duration_seconds": 1800,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "manual"
    assert data["duration_seconds"] == 1800


def test_add_manual_time_entry_invalid_string(client):
    # AC: The user can manually add a block of time to their daily total without using the automatic timer.
    # Edge case: invalid duration string format.
    response = client.post(
        "/api/v1/time-entries",
        json={
            "type": "manual",
            "description": "Invalid duration",
            "duration_string": "invalid_format",
        },
    )
    assert response.status_code == 400
    assert "Invalid duration format" in response.json()["detail"]


def test_get_today_summary(client):
    # AC: The user can view a clear summary of all time logged for the current day,
    # including both automatically timed and manually entered durations.
    # A running total for the day is always visible.

    # 1. Add a timed entry
    client.post(
        "/api/v1/time-entries",
        json={"type": "timed", "description": "Task A", "duration_seconds": 3600},
    )

    # 2. Add a manual entry
    client.post(
        "/api/v1/time-entries",
        json={"type": "manual", "description": "Task B", "duration_string": "45m"},
    )

    # 3. Get today's summary
    response = client.get("/api/v1/time-entries/today")
    assert response.status_code == 200
    data = response.json()
    assert len(data["entries"]) == 2
    assert data["total_duration_seconds"] == 3600 + 45 * 60


def test_list_all_time_entries(client):
    # AC: List all time entries.
    client.post(
        "/api/v1/time-entries",
        json={"type": "manual", "description": "Task C", "duration_seconds": 1200},
    )
    response = client.get("/api/v1/time-entries")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["description"] == "Task C"


def test_delete_time_entry(client):
    # AC: Delete a specific time entry.
    post_response = client.post(
        "/api/v1/time-entries",
        json={
            "type": "manual",
            "description": "Task to delete",
            "duration_seconds": 600,
        },
    )
    entry_id = post_response.json()["id"]

    # Delete the entry
    delete_response = client.delete(f"/api/v1/time-entries/{entry_id}")
    assert delete_response.status_code == 204

    # Verify it is deleted
    get_response = client.get("/api/v1/time-entries")
    assert len(get_response.json()) == 0


def test_delete_nonexistent_entry(client):
    # AC: Delete a specific time entry.
    # Edge case: entry not found.
    response = client.delete("/api/v1/time-entries/nonexistent-id")
    assert response.status_code == 404
    assert "Entry not found" in response.json()["detail"]
