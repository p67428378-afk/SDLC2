from typing import List, Dict, Any
from pydantic import BaseModel


# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    message: str
    mfa_token: str


class MFAVerifyRequest(BaseModel):
    code: str
    mfa_token: str


class UserResponse(BaseModel):
    id: str
    username: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Dashboard Schemas
class AccountSummary(BaseModel):
    accountNumber: str
    balance: float
    id: str
    institution: str
    name: str
    status: str
    type: str


class DashboardResponse(BaseModel):
    accounts: List[AccountSummary]
    netWorth: float
    totalDeposits: float
    totalMortgage: float


# Account Details Schemas
class AccountDetailsResponse(BaseModel):
    accountNumber: str
    balance: float
    details: Dict[str, Any]
    id: str
    institution: str
    name: str
    status: str
    type: str


# Mock Schemas
class FiservAccount(BaseModel):
    accountNumber: str
    balance: float
    id: str
    type: str


class FiservResponse(BaseModel):
    accounts: List[FiservAccount]
    cifId: str


class CenlarMortgage(BaseModel):
    accountNumber: str
    balance: float
    escrowBalance: float
    id: str


class CenlarResponse(BaseModel):
    customerId: str
    mortgages: List[CenlarMortgage]


class MockConfigRequest(BaseModel):
    scenario: str


class MockConfigResponse(BaseModel):
    scenario: str
    status: str
