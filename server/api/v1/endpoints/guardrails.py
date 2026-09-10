from fastapi import APIRouter
from server.schemas import GuardrailCheckRequest, GuardrailCheckResponse
from server.services.assortment_service import evaluate_guardrails

router = APIRouter(prefix="/guardrails", tags=["guardrails"])


@router.post("/check", response_model=GuardrailCheckResponse)
def check_guardrails_endpoint(payload: GuardrailCheckRequest):
    return evaluate_guardrails(
        shelf_capacity_pct=payload.shelf_capacity_pct if payload.shelf_capacity_pct is not None else 92.0,
        private_brand_pct=payload.private_brand_pct if payload.private_brand_pct is not None else 28.0,
        in_stock_rate_pct=payload.in_stock_rate_pct if payload.in_stock_rate_pct is not None else 96.5,
    )
