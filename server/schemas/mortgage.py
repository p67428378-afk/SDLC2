from pydantic import BaseModel


# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# Mortgage Details Schema
class MortgageDetailsResponse(BaseModel):
    currentBalance: float
    escrowBalance: float
    interestRate: float
    loanNumber: str
    minimumPaymentAmount: float
    nextPaymentDueDate: str


# Funding Account Schema
class FundingAccountResponse(BaseModel):
    accountId: str
    accountName: str
    accountType: str  # DDA or Savings
    balance: float


# Account Validation Schemas
class AccountValidationRequest(BaseModel):
    paymentAmount: float


class AccountValidationResponse(BaseModel):
    availableBalance: float
    sufficientFunds: bool


# Payment Submission Schemas
class PaymentSubmissionRequest(BaseModel):
    amount: float
    date: str  # YYYY-MM-DD
    fromAccountId: str
    loanNumber: str


class PaymentSubmissionResponse(BaseModel):
    cenlarConfirmationId: str
    status: str  # SUBMITTED, PROCESSED, FAILED
    timestamp: str  # ISO 8601
    transactionId: str


# Scheduled Payment Schema
class ScheduledPaymentResponse(BaseModel):
    amount: float
    paymentDate: str  # YYYY-MM-DD
    paymentId: str
    status: str  # SCHEDULED, PROCESSED, FAILED


# Receipt Schema
class ReceiptResponse(BaseModel):
    amount: float
    date: str  # YYYY-MM-DD
    receiptId: str
    status: str
    transactionId: str
