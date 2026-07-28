from fastapi import APIRouter, Depends
from server.auth import get_current_user
from server.models import User
from server.schemas import DashboardResponse
from server.services.aggregation import aggregate_accounts

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user)):
    return aggregate_accounts(
        fiserv_cif_id=current_user.fiserv_cif_id,
        cenlar_customer_id=current_user.cenlar_customer_id,
    )
