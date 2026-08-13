from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import datetime


class KPISchema(BaseModel):
    sales_per_linear_ft: float
    private_brand_pct: float
    in_stock_rate: float
    shelf_capacity: float

    model_config = ConfigDict(from_attributes=True)


class SKUSchema(BaseModel):
    sku_id: str
    product_name: str
    sales: float
    units_sold: int
    sales_per_linear_ft: float
    is_private_brand: bool
    status: str

    model_config = ConfigDict(from_attributes=True)


class SKUActionSchema(BaseModel):
    action_type: str
    sku_id: str
    product_name: str

    model_config = ConfigDict(from_attributes=True)


class GuardrailsSchema(BaseModel):
    private_brand_pass: bool
    shelf_capacity_pass: bool


class ScenarioSchema(BaseModel):
    scenario_name: str
    projected_sales_growth_pct: float
    projected_private_brand_pct: float
    projected_in_stock_rate: float
    projected_shelf_capacity_pct: float
    guardrails: GuardrailsSchema
    sku_actions: List[SKUActionSchema]

    model_config = ConfigDict(from_attributes=True)


class SubmissionCreate(BaseModel):
    scenario_name: str


class SubmissionResponse(BaseModel):
    id: str
    scenario_name: str
    submitted_by: str
    status: str
    audit_trail_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubmissionDetailResponse(BaseModel):
    id: str
    scenario_name: str
    submitted_by: str
    status: str
    audit_trail_id: str
    created_at: datetime
    sku_actions: List[SKUActionSchema]

    model_config = ConfigDict(from_attributes=True)
