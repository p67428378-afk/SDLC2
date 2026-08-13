import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from server.database import Base


# Helper to generate UUID as string or UUID object depending on DB
def generate_uuid():
    return str(uuid.uuid4())


class SKU(Base):
    __tablename__ = "skus"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    sku_id = Column(String(50), unique=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    sales = Column(Numeric(12, 2), default=0.00, nullable=False)
    units_sold = Column(Integer, default=0, nullable=False)
    sales_per_linear_ft = Column(Numeric(12, 2), default=0.00, nullable=False)
    is_private_brand = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default="MAINTAIN", nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    name = Column(String(50), unique=True, nullable=False)
    projected_sales_growth_pct = Column(Numeric(5, 2), default=0.00, nullable=False)
    projected_private_brand_pct = Column(Numeric(5, 2), default=0.00, nullable=False)
    projected_in_stock_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    projected_shelf_capacity_pct = Column(Numeric(5, 2), default=0.00, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    scenario_name = Column(String(50), nullable=False)
    submitted_by = Column(String(255), nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)
    audit_trail_id = Column(
        String(36), unique=True, default=generate_uuid, nullable=False
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    sku_actions = relationship(
        "SKUAction", back_populates="submission", cascade="all, delete-orphan"
    )


class SKUAction(Base):
    __tablename__ = "sku_actions"

    id = Column(
        String(36), primary_key=True, default=generate_uuid, unique=True, nullable=False
    )
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False)
    action_type = Column(String(20), nullable=False)
    sku_id = Column(String(50), nullable=False)
    product_name = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    submission = relationship("Submission", back_populates="sku_actions")
