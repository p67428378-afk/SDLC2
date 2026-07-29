from fastapi import APIRouter, Depends, Request
from server.auth import get_current_user
from server.models import User
from server.services.aggregation import aggregate_dashboard_data
from server.schemas import DashboardResponse

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(req: Request, current_user: User = Depends(get_current_user)):
    return aggregate_dashboard_data(current_user, req)
