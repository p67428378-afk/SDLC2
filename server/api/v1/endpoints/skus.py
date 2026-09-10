from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Sku
from server.schemas import SkuResponse, SkuListResponse

router = APIRouter(prefix="/skus", tags=["skus"])


@router.get("", response_model=SkuListResponse)
def list_skus(
    category: Optional[str] = Query("Snacks", description="Product category"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Max items to return"),
    search: Optional[str] = Query(None, description="Search term for SKU code or product name"),
    db: Session = Depends(get_db),
):
    query = db.query(Sku)
    if category:
        query = query.filter(Sku.category == category)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Sku.sku_code.ilike(search_pattern)) | (Sku.product_name.ilike(search_pattern))
        )

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return SkuListResponse(
        total=total,
        items=[SkuResponse.model_validate(item) for item in items],
    )


@router.get("/{sku_code}", response_model=SkuResponse)
def get_sku_by_code(
    sku_code: str,
    db: Session = Depends(get_db),
):
    sku = db.query(Sku).filter(Sku.sku_code == sku_code).first()
    if not sku:
        raise HTTPException(status_code=404, detail=f"SKU '{sku_code}' not found.")
    return SkuResponse.model_validate(sku)
