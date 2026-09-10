import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(64), nullable=False, default="user")
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)


class Sku(Base):
    __tablename__ = "skus"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sku_code = Column(String(64), unique=True, nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False, index=True)
    weekly_velocity = Column(Float, nullable=False, default=0.0)
    margin_pct = Column(Float, nullable=False, default=0.0)
    linear_feet = Column(Float, nullable=False, default=0.0)
    is_private_brand = Column(Boolean, nullable=False, default=False)
    status_badge = Column(String(32), nullable=False, default="MAINTAIN")
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)


class ClusterMetric(Base):
    __tablename__ = "cluster_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cluster_name = Column(String(128), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)
    sales_per_linear_ft = Column(Float, nullable=False, default=0.0)
    private_brand_pct = Column(Float, nullable=False, default=0.0)
    in_stock_rate_pct = Column(Float, nullable=False, default=0.0)
    shelf_capacity_pct = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)


class ScenarioConfig(Base):
    __tablename__ = "scenario_configs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_type = Column(String(64), nullable=False, unique=True, index=True)
    projected_sales_delta_pct = Column(Float, nullable=False, default=0.0)
    projected_pb_share_pct = Column(Float, nullable=False, default=0.0)
    projected_margin_delta_pct = Column(Float, nullable=False, default=0.0)
    recommended_sku_actions_json = Column(JSON, nullable=False, default=dict)
    is_default = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)


class SubmissionAudit(Base):
    __tablename__ = "submission_audits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(String(128), nullable=False)
    cluster_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    selected_scenario = Column(String(64), nullable=False)
    sku_decisions_json = Column(JSON, nullable=False, default=list)
    guardrail_status_json = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)
