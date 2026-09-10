from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class ClusterMetricsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cluster_name: str
    category: str
    sales_per_linear_ft: float
    private_brand_pct: float
    in_stock_rate_pct: float
    shelf_capacity_pct: float
    last_updated: datetime


class SkuResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sku_code: str
    product_name: str
    category: str
    weekly_velocity: float
    margin_pct: float
    linear_feet: float
    is_private_brand: bool
    status_badge: str


class SkuListResponse(BaseModel):
    total: int
    items: List[SkuResponse]


class ScenarioEvaluateRequest(BaseModel):
    cluster_name: Optional[str] = "Small Town Value Cluster"
    category: Optional[str] = "Snacks"
    scenario_type: str = Field(..., description="Conservative, Balanced, or Aggressive")


class ScenarioEvaluationResponse(BaseModel):
    scenario_type: str
    projected_sales_lift_pct: float
    projected_private_brand_share_pct: float
    projected_margin_delta_pct: float
    recommended_sku_actions: Dict[str, int]


class GuardrailCheckRequest(BaseModel):
    shelf_capacity_pct: Optional[float] = 92.0
    private_brand_pct: Optional[float] = 28.0
    in_stock_rate_pct: Optional[float] = 96.5


class GuardrailItem(BaseModel):
    name: str
    status: str  # "PASSED", "WARNING", "FAILED"
    message: str
    value: float
    threshold: float
    operator: str


class GuardrailCheckResponse(BaseModel):
    all_passed: bool
    guardrails: List[GuardrailItem]


class SkuDecisionItem(BaseModel):
    sku_code: str
    action: str = Field(..., description="GROW, MAINTAIN, SWAP, or REDUCE")


class SubmissionRequest(BaseModel):
    user_id: Optional[str] = "usr_cat_mgr_01"
    cluster_name: Optional[str] = "Small Town Value Cluster"
    category: Optional[str] = "Snacks"
    selected_scenario: str
    sku_decisions: List[SkuDecisionItem] = Field(default_factory=list)


class SubmissionResponse(BaseModel):
    status: str
    audit_id: str
    timestamp: datetime
    message: str
    sku_decisions_count: int


class AuditRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    audit_id: str
    user_id: str
    cluster_name: str
    category: str
    selected_scenario: str
    sku_decisions_json: Any
    guardrail_status_json: Any
    created_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
