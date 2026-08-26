from server.routers.auth import router as auth_router
from server.routers.projects import router as projects_router
from server.routers.timesheets import router as timesheets_router

__all__ = ["auth_router", "projects_router", "timesheets_router"]
