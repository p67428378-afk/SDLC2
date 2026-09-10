from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import ScenarioConfig
from server.schemas import ScenarioEvaluateRequest, ScenarioEvaluationResponse
from server.services.assortment_service import evaluate_scenario_logic

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.post("/evaluate", response_model=ScenarioEvaluationResponse)
def evaluate_scenario(
    payload: ScenarioEvaluateRequest,
    db: Session = Depends(get_db),
):
    return evaluate_scenario_logic(
        db=db,
        scenario_type=payload.scenario_type,
        cluster_name=payload.cluster_name or "Small Town Value Cluster",
        category=payload.category or "Snacks",
    )


@router.get("", response_model=List[ScenarioEvaluationResponse])
def list_scenarios(db: Session = Depends(get_db)):
    scenarios = db.query(ScenarioConfig).all()
    results = []
    for s in scenarios:
        results.append(
            ScenarioEvaluationResponse(
                scenario_type=s.scenario_type,
                projected_sales_lift_pct=s.projected_sales_delta_pct,
                projected_private_brand_share_pct=s.projected_pb_share_pct,
                projected_margin_delta_pct=s.projected_margin_delta_pct,
                recommended_sku_actions=s.recommended_sku_actions_json or {},
            )
        )
    return results
