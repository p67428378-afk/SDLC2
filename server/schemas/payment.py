from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime


class CheckoutSessionCreate(BaseModel):
    amount: float = Field(
        ..., gt=0, description="Transaction amount in original currency"
    )
    currency: str = Field(
        ..., min_length=3, max_length=3, description="3-letter ISO currency code"
    )
    target_currency: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="Target currency code for processing",
    )
    customer_id: str = Field(..., min_length=1, description="Customer identifier")
    description: Optional[str] = Field(
        None, max_length=255, description="Order / checkout description"
    )

    @field_validator("currency", "target_currency", mode="before")
    @classmethod
    def uppercase_currency(cls, v):
        if isinstance(v, str):
            return v.strip().upper()
        return v


class CheckoutSessionResponse(BaseModel):
    session_id: str
    payment_intent_id: Optional[str] = None
    client_secret: Optional[str] = None
    amount_original: float
    currency_original: str
    amount_converted: float
    currency_target: str
    exchange_rate: float
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DigitalWalletRequest(BaseModel):
    session_id: str = Field(..., description="ID of the created checkout session")
    wallet_provider: str = Field(
        ..., description="Digital wallet provider: APPLE_PAY or GOOGLE_PAY"
    )
    token: Union[Dict[str, Any], str] = Field(
        ..., description="Tokenized wallet payload (e.g. PKPayment token)"
    )

    @field_validator("wallet_provider")
    @classmethod
    def validate_provider(cls, v):
        normalized = v.strip().upper()
        if normalized not in ("APPLE_PAY", "GOOGLE_PAY"):
            raise ValueError("wallet_provider must be APPLE_PAY or GOOGLE_PAY")
        return normalized


class DigitalWalletResponse(BaseModel):
    transaction_id: str
    status: str
    wallet_provider: str
    masked_account: str
    created_at: datetime

    class Config:
        from_attributes = True


class RefundItemResponse(BaseModel):
    refund_id: str
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    transaction_id: str
    session_id: Optional[str] = None
    payment_intent_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    payment_method_type: str
    masked_account: Optional[str] = None
    customer_id: Optional[str] = None
    refunds: List[RefundItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
