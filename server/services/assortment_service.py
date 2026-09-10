import random
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from server.models import Sku, ClusterMetric, ScenarioConfig, SubmissionAudit
from server.schemas import (
    ScenarioEvaluationResponse,
    GuardrailCheckResponse,
    GuardrailItem,
    SubmissionRequest,
    SubmissionResponse,
)


def evaluate_scenario_logic(
    db: Session,
    scenario_type: str,
    cluster_name: str = "Small Town Value Cluster",
    category: str = "Snacks",
) -> ScenarioEvaluationResponse:
    norm_type = scenario_type.capitalize()
    if norm_type not in ["Conservative", "Balanced", "Aggressive"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario_type '{scenario_type}'. Must be one of Conservative, Balanced, Aggressive.",
        )

    config = (
        db.query(ScenarioConfig)
        .filter(ScenarioConfig.scenario_type == norm_type)
        .first()
    )

    if config:
        return ScenarioEvaluationResponse(
            scenario_type=config.scenario_type,
            projected_sales_lift_pct=config.projected_sales_delta_pct,
            projected_private_brand_share_pct=config.projected_pb_share_pct,
            projected_margin_delta_pct=config.projected_margin_delta_pct,
            recommended_sku_actions=config.recommended_sku_actions_json or {},
        )

    # Dynamic fallback
    defaults = {
        "Conservative": (3.2, 26.5, 0.8, {"GROW": 2, "MAINTAIN": 8, "SWAP": 1, "REDUCE": 1}),
        "Balanced": (5.8, 28.0, 1.5, {"GROW": 4, "MAINTAIN": 5, "SWAP": 2, "REDUCE": 1}),
        "Aggressive": (8.5, 31.2, 2.4, {"GROW": 6, "MAINTAIN": 3, "SWAP": 2, "REDUCE": 1}),
    }
    lift, pb, margin, actions = defaults[norm_type]
    return ScenarioEvaluationResponse(
        scenario_type=norm_type,
        projected_sales_lift_pct=lift,
        projected_private_brand_share_pct=pb,
        projected_margin_delta_pct=margin,
        recommended_sku_actions=actions,
    )


def evaluate_guardrails(
    shelf_capacity_pct: float = 92.0,
    private_brand_pct: float = 28.0,
    in_stock_rate_pct: float = 96.5,
) -> GuardrailCheckResponse:
    guardrails: List[GuardrailItem] = []
    all_passed = True

    # 1. Shelf Capacity Rule (<= 100.0%)
    cap_passed = shelf_capacity_pct <= 100.0
    if cap_passed:
        headroom = round(100.0 - shelf_capacity_pct, 1)
        cap_msg = f"Within limits ({headroom}% headroom)"
        cap_status = "PASSED"
    else:
        cap_msg = f"Shelf capacity utilization ({shelf_capacity_pct}%) exceeds 100.0% limit"
        cap_status = "FAILED"
        all_passed = False

    guardrails.append(
        GuardrailItem(
            name="Shelf Capacity",
            status=cap_status,
            message=cap_msg,
            value=shelf_capacity_pct,
            threshold=100.0,
            operator="<=",
        )
    )

    # 2. Private Brand Target (>= 25.0%)
    pb_passed = private_brand_pct >= 25.0
    if pb_passed:
        excess = round(private_brand_pct - 25.0, 1)
        pb_msg = f"Exceeds target by +{excess}%"
        pb_status = "PASSED"
    else:
        pb_msg = f"Private brand share ({private_brand_pct}%) below 25.0% threshold"
        pb_status = "FAILED"
        all_passed = False

    guardrails.append(
        GuardrailItem(
            name="Private Brand Share",
            status=pb_status,
            message=pb_msg,
            value=private_brand_pct,
            threshold=25.0,
            operator=">=",
        )
    )

    # 3. In-Stock SLA Rule (>= 95.0%)
    stock_passed = in_stock_rate_pct >= 95.0
    if stock_passed:
        stock_msg = "Cluster SLA satisfied"
        stock_status = "PASSED"
    else:
        stock_msg = f"In-stock rate ({in_stock_rate_pct}%) below 95.0% SLA threshold"
        stock_status = "FAILED"
        all_passed = False

    guardrails.append(
        GuardrailItem(
            name="In-Stock SLA Rate",
            status=stock_status,
            message=stock_msg,
            value=in_stock_rate_pct,
            threshold=95.0,
            operator=">=",
        )
    )

    return GuardrailCheckResponse(all_passed=all_passed, guardrails=guardrails)


def generate_audit_id() -> str:
    random_digits = random.randint(10000, 99999)
    return f"AUD-2026-{random_digits}"


def submit_assortment_plan(
    db: Session,
    payload: SubmissionRequest,
) -> SubmissionResponse:
    if not payload.selected_scenario:
        raise HTTPException(status_code=400, detail="selected_scenario is required.")

    # Run guardrails
    metric = (
        db.query(ClusterMetric)
        .filter(
            ClusterMetric.cluster_name == payload.cluster_name,
            ClusterMetric.category == payload.category,
        )
        .first()
    )

    shelf_cap = metric.shelf_capacity_pct if metric else 92.0
    pb_share = metric.private_brand_pct if metric else 28.0
    in_stock = metric.in_stock_rate_pct if metric else 96.5

    guardrail_result = evaluate_guardrails(
        shelf_capacity_pct=shelf_cap,
        private_brand_pct=pb_share,
        in_stock_rate_pct=in_stock,
    )

    # Generate unique audit id
    audit_id = generate_audit_id()
    while db.query(SubmissionAudit).filter(SubmissionAudit.audit_id == audit_id).first():
        audit_id = generate_audit_id()

    sku_decisions_data = [d.model_dump() for d in payload.sku_decisions]

    audit_entry = SubmissionAudit(
        audit_id=audit_id,
        user_id=payload.user_id or "usr_cat_mgr_01",
        cluster_name=payload.cluster_name or "Small Town Value Cluster",
        category=payload.category or "Snacks",
        selected_scenario=payload.selected_scenario,
        sku_decisions_json=sku_decisions_data,
        guardrail_status_json=guardrail_result.model_dump(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)

    decision_count = len(sku_decisions_data)
    message = f"Assortment plan submitted successfully. Audit ID: {audit_id}. {decision_count} SKU decisions logged."

    return SubmissionResponse(
        status="SUCCESS",
        audit_id=audit_id,
        timestamp=audit_entry.created_at,
        message=message,
        sku_decisions_count=decision_count,
    )
