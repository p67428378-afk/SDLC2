from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict, model_validator


class CartItem(BaseModel):
    id: Optional[str] = None
    name: str
    price: Optional[float] = None
    unit_price: Optional[float] = None
    quantity: int = 1

    @model_validator(mode="before")
    @classmethod
    def reconcile_price(cls, data: Any) -> Any:
        if isinstance(data, dict):
            p = data.get("price")
            up = data.get("unit_price")
            if p is None and up is not None:
                data["price"] = up
            elif up is None and p is not None:
                data["unit_price"] = p
        return data

    @model_validator(mode="after")
    def ensure_price_fields(self) -> "CartItem":
        if self.price is None and self.unit_price is not None:
            self.price = self.unit_price
        elif self.unit_price is None and self.price is not None:
            self.unit_price = self.price
        elif self.price is None and self.unit_price is None:
            self.price = 0.0
            self.unit_price = 0.0
        return self


class CheckoutSessionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Cart total amount")
    currency: str = Field(
        "USD", min_length=3, max_length=3, description="ISO 4217 currency code"
    )
    customer_email: Optional[str] = None
    items: Optional[List[CartItem]] = None
    cardholder_name: Optional[str] = None
    card_number: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    cvv: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    payment_intent_id: Optional[str] = None
    client_secret: Optional[str] = None
    base_amount: float
    base_currency: str
    target_amount: float
    target_currency: str
    exchange_rate: float


class DigitalWalletPaymentRequest(BaseModel):
    wallet_type: str = Field(..., description="'apple_pay' or 'google_pay'")
    payment_token: str = Field(
        ..., min_length=1, description="Raw payment token from Apple/Google SDK"
    )
    amount: float = Field(..., gt=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    customer_email: Optional[str] = None


class RefundRequest(BaseModel):
    transaction_id: str = Field(..., description="Target transaction ID")
    amount: float = Field(..., gt=0, description="Amount to refund")
    reason: str = Field(..., min_length=1, description="Mandatory reason for refund")
    memo: Optional[str] = None
    refund_type: Optional[str] = "full"


class RefundSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: str
    refund_amount: float
    currency: str
    reason: str
    status: str
    created_at: str


class TransactionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: Optional[str] = None
    customer_email: Optional[str] = None
    amount: float
    currency: str
    payment_method: str
    status: str
    created_at: str


class TransactionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: Optional[str] = None
    customer_email: Optional[str] = None
    amount: float
    currency: str = "USD"
    base_currency: str = "USD"
    target_currency: str = "USD"
    converted_amount: float
    exchange_rate: float
    payment_method: str
    status: str
    refunded_amount: float
    remaining_refundable_balance: float
    refunds: List[RefundSummary] = []
    created_at: str


class ExchangeRateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    base_currency: str
    target_currency: str
    rate: float
    timestamp: str


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: Optional[str] = None
    event_type: str
    action: Optional[str] = None
    ip_address: Optional[str] = None
    user_id: Optional[str] = None
    status_code: Optional[int] = 200
    signature_valid: Optional[bool] = True
    masked_payload: Optional[Dict[str, Any]] = None
    created_at: str
