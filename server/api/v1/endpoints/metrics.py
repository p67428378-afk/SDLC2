from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from server.database import get_db
from server.models import ClusterMetric
from server.schemas import ClusterMetricsResponse

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/kpi", response_model=ClusterMetricsResponse)
def get_kpi_metrics(
    cluster_name: str = Query("Small Town Value Cluster", description="Target store cluster"),
    category: str = Query("Snacks", description="Target merchandise category"),
    db: Session = Depends(get_db),
):
    metric = (
        db.query(ClusterMetric)
        .filter(
            ClusterMetric.cluster_name == cluster_name,
            ClusterMetric.category == category,
        )
        .first()
    )

    if metric:
        return ClusterMetricsResponse(
            cluster_name=metric.cluster_name,
            category=metric.category,
            sales_per_linear_ft=metric.sales_per_linear_ft,
            private_brand_pct=metric.private_brand_pct,
            in_stock_rate_pct=metric.in_stock_rate_pct,
            shelf_capacity_pct=metric.shelf_capacity_pct,
            last_updated=metric.updated_at or metric.created_at,
        )

    # Fallback default if not seeded
    return ClusterMetricsResponse(
        cluster_name=cluster_name,
        category=category,
        sales_per_linear_ft=450.00,
        private_brand_pct=28.00,
        in_stock_rate_pct=96.50,
        shelf_capacity_pct=92.00,
        last_updated=datetime.now(timezone.utc),
    )
