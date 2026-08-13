from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List, Dict, Any
from server.models import SKU, Scenario, Submission, SKUAction
import uuid


def get_kpis(db: Session) -> Dict[str, float]:
    # Return the four main KPI values from the HTML
    return {
        "sales_per_linear_ft": 1245.50,
        "private_brand_pct": 24.5,
        "in_stock_rate": 96.2,
        "shelf_capacity": 4500.0,
    }


def get_skus(
    db: Session, sort_by: Optional[str] = None, status: Optional[str] = None
) -> List[SKU]:
    query = db.query(SKU)

    if status:
        query = query.filter(SKU.status == status.upper())

    if sort_by:
        sort_by = sort_by.lower()
        if sort_by == "sales":
            query = query.order_by(desc(SKU.sales))
        elif sort_by == "units_sold":
            query = query.order_by(desc(SKU.units_sold))
        elif sort_by == "sales_per_linear_ft":
            query = query.order_by(desc(SKU.sales_per_linear_ft))

    return query.all()


# Static scenario actions mapping
SCENARIO_ACTIONS = {
    "Conservative": [
        {
            "action_type": "ADD",
            "sku_id": "SKU-10045",
            "product_name": "Clover Valley Spicy Chips",
        },
        {
            "action_type": "REMOVE",
            "sku_id": "SKU-34098",
            "product_name": "Generic Pretzels",
        },
    ],
    "Balanced": [
        {
            "action_type": "ADD",
            "sku_id": "SKU-10045",
            "product_name": "Clover Valley Spicy Chips",
        },
        {
            "action_type": "REMOVE",
            "sku_id": "SKU-34098",
            "product_name": "Generic Pretzels",
        },
        {
            "action_type": "SWAP",
            "sku_id": "SKU-55210",
            "product_name": "Clover Valley Trail Mix",
        },
    ],
    "Aggressive": [
        {
            "action_type": "ADD",
            "sku_id": "SKU-10045",
            "product_name": "Clover Valley Spicy Chips",
        },
        {
            "action_type": "ADD",
            "sku_id": "SKU-10046",
            "product_name": "Clover Valley Cheese Crackers",
        },
        {
            "action_type": "REMOVE",
            "sku_id": "SKU-34098",
            "product_name": "Generic Pretzels",
        },
        {
            "action_type": "REMOVE",
            "sku_id": "SKU-89211",
            "product_name": "Doritos Nacho Cheese",
        },
    ],
}


def get_scenario(db: Session, scenario_name: str) -> Optional[Dict[str, Any]]:
    # Case-insensitive lookup
    scenario_db = db.query(Scenario).filter(Scenario.name.ilike(scenario_name)).first()
    if not scenario_db:
        return None

    # Determine guardrails
    # Conservative: private_brand_pass=False, shelf_capacity_pass=True
    # Balanced: private_brand_pass=True, shelf_capacity_pass=True
    # Aggressive: private_brand_pass=True, shelf_capacity_pass=False
    name_lower = scenario_db.name.lower()
    if name_lower == "conservative":
        private_brand_pass = False
        shelf_capacity_pass = True
    elif name_lower == "balanced":
        private_brand_pass = True
        shelf_capacity_pass = True
    else:
        private_brand_pass = True
        shelf_capacity_pass = False

    actions = SCENARIO_ACTIONS.get(scenario_db.name, [])

    return {
        "scenario_name": scenario_db.name,
        "projected_sales_growth_pct": float(scenario_db.projected_sales_growth_pct),
        "projected_private_brand_pct": float(scenario_db.projected_private_brand_pct),
        "projected_in_stock_rate": float(scenario_db.projected_in_stock_rate),
        "projected_shelf_capacity_pct": float(scenario_db.projected_shelf_capacity_pct),
        "guardrails": {
            "private_brand_pass": private_brand_pass,
            "shelf_capacity_pass": shelf_capacity_pass,
        },
        "sku_actions": actions,
    }


def create_submission(db: Session, scenario_name: str) -> Optional[Submission]:
    # Verify scenario exists
    scenario_db = db.query(Scenario).filter(Scenario.name.ilike(scenario_name)).first()
    if not scenario_db:
        return None

    # Create submission
    submission = Submission(
        scenario_name=scenario_db.name,
        submitted_by="John Doe",  # Default user from HTML
        status="PENDING",
        audit_trail_id=str(uuid.uuid4()),
    )
    db.add(submission)
    db.flush()  # Get submission.id

    # Copy actions
    actions = SCENARIO_ACTIONS.get(scenario_db.name, [])
    for action_data in actions:
        action = SKUAction(
            submission_id=submission.id,
            action_type=action_data["action_type"],
            sku_id=action_data["sku_id"],
            product_name=action_data["product_name"],
        )
        db.add(action)

    db.commit()
    db.refresh(submission)
    return submission


def get_submission(db: Session, submission_id: str) -> Optional[Submission]:
    return db.query(Submission).filter(Submission.id == submission_id).first()
