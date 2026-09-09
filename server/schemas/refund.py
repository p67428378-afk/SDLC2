from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RefundCreate(BaseModel):
    transaction_id: str = Field(..., description="Transaction ID to refund")
    amount: float = Field(..., gt=0, description="Amount to refund")
    reason: Optional[str] = Field(None, max_length=255, description="Refund reason")


class RefundResponse(BaseModel):
    refund_id: str
    transaction_id: str
    amount_refunded: float
    currency: str
    status: str
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
