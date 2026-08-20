import json
import os
from server.main import app


def test_openapi_spec_generation():
    schema = app.openapi()
    assert schema is not None
    assert "paths" in schema
    assert "/api/v1/projects" in schema["paths"]
    assert "/api/v1/time-entries" in schema["paths"]
    assert "/api/v1/time-entries/daily-summary" in schema["paths"]

    # Export openapi.json at both repo root and server directory
    json_str = json.dumps(schema, indent=2)

    # Root openapi.json
    root_openapi_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "openapi.json"
    )
    with open(root_openapi_path, "w") as f:
        f.write(json_str)

    # Server openapi.json
    server_openapi_path = os.path.join(os.path.dirname(__file__), "..", "openapi.json")
    with open(server_openapi_path, "w") as f:
        f.write(json_str)

    assert os.path.exists(root_openapi_path)
    assert os.path.exists(server_openapi_path)
