from pydantic import BaseModel
from typing import Optional


# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Mortgage Schemas
class MortgageDetailsResponse(BaseModel):
    id: str
    loanNumber: str
    outstandingBalance: float
    nextPaymentDueDate: str
    minimumPaymentDue: float
    interestRate: float
    escrowBalance: float
    loanTerm: str
    maturityDate: str


# Account Schemas
class AccountResponse(BaseModel):
    id: str
    accountName: str
    accountType: str
    availableBalance: float
    maskedAccountNumber: str


# Payment Validation Schemas
class PaymentValidationRequest(BaseModel):
    amount: float
    mortgageId: str
    paymentDate: str
    sourceAccountId: str


class PaymentValidationResponse(BaseModel):
    availableBalance: float
    isDuplicate: bool
    isValid: bool
    warningMessage: Optional[str] = None


# Payment Submission Schemas
class PaymentSubmissionRequest(BaseModel):
    amount: float
    idempotencyKey: str
    mortgageId: str
    paymentDate: str
    sourceAccountId: str


class PaymentSubmissionResponse(BaseModel):
    confirmationNumber: str
    status: str
    timestamp: str
    transactionId: str
    updatedMortgageBalance: float


class PaymentDetailsResponse(BaseModel):
    amount: float
    confirmationNumber: str
    mortgageId: str
    paymentDate: str
    sourceAccountId: str
    status: str
    timestamp: str
    transactionId: str
    updatedMortgageBalance: float


# Scheduled Payment Schemas
class ScheduledPaymentRequest(BaseModel):
    amount: float
    endDate: Optional[str] = None
    frequency: str
    mortgageId: str
    sourceAccountId: str
    startDate: str


class ScheduledPaymentUpdateRequest(BaseModel):
    amount: float
    endDate: Optional[str] = None
    frequency: str
    isActive: bool
    startDate: str


class ScheduledPaymentResponse(BaseModel):
    id: str
    amount: float
    endDate: Optional[str] = None
    frequency: str
    isActive: bool
    mortgageId: str
    sourceAccountId: str
    startDate: str


class ScheduledPaymentDeleteResponse(BaseModel):
    message: str
    success: bool


# Payment History Schemas
class PaymentHistoryResponse(BaseModel):
    amount: float
    confirmationNumber: str
    date: str
    description: str
    status: str
