from fastapi import APIRouter, HTTPException, status, Request
from typing import Literal
from pydantic import BaseModel
from server.schemas import (
    MockConfigResponse,
    FiservAccountsResponse,
    CenlarMortgagesResponse,
    FiservAccount,
    CenlarMortgage,
)

router = APIRouter(prefix="/api/v1/mock", tags=["mocks"])

# Global in-memory state for the mock scenario
CURRENT_SCENARIO = "default"


class ValidatedMockConfigRequest(BaseModel):
    scenario: Literal[
        "default",
        "delinquent",
        "no_accounts",
        "single_account",
        "high_balance",
        "error_fiserv",
        "error_cenlar",
    ]


@router.post("/config", response_model=MockConfigResponse)
def configure_mock(request: ValidatedMockConfigRequest, req: Request):
    global CURRENT_SCENARIO
    CURRENT_SCENARIO = request.scenario

    # Also store in session state if session is available
    if hasattr(req, "session"):
        req.session["mock_scenario"] = request.scenario

    return MockConfigResponse(scenario=CURRENT_SCENARIO, status="success")


@router.get("/fiserv/accounts/{cifId}", response_model=FiservAccountsResponse)
def get_fiserv_accounts(cifId: str, req: Request):
    global CURRENT_SCENARIO
    scenario = CURRENT_SCENARIO
    if hasattr(req, "session") and "mock_scenario" in req.session:
        scenario = req.session["mock_scenario"]

    if scenario == "error_fiserv":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Fiserv API is currently unavailable",
        )

    if scenario == "no_accounts":
        return FiservAccountsResponse(accounts=[], cifId=cifId)

    if scenario == "single_account":
        return FiservAccountsResponse(
            accounts=[
                FiservAccount(
                    id="fiserv-chk-1",
                    accountNumber="CHK-12750",
                    balance=12750.00,
                    type="Checking",
                )
            ],
            cifId=cifId,
        )

    if scenario == "high_balance":
        return FiservAccountsResponse(
            accounts=[
                FiservAccount(
                    id="fiserv-sav-1",
                    accountNumber="SAV-600000",
                    balance=600000.00,
                    type="Savings",
                ),
                FiservAccount(
                    id="fiserv-chk-1",
                    accountNumber="CHK-150000",
                    balance=150000.00,
                    type="Checking",
                ),
            ],
            cifId=cifId,
        )

    # default, delinquent, error_cenlar
    return FiservAccountsResponse(
        accounts=[
            FiservAccount(
                id="fiserv-sav-1",
                accountNumber="SAV-85400",
                balance=85400.00,
                type="Savings",
            ),
            FiservAccount(
                id="fiserv-chk-1",
                accountNumber="CHK-12750",
                balance=12750.00,
                type="Checking",
            ),
            FiservAccount(
                id="fiserv-cd-1", accountNumber="CD-14000", balance=14000.00, type="CD"
            ),
        ],
        cifId=cifId,
    )


@router.get("/cenlar/mortgages/{customerId}", response_model=CenlarMortgagesResponse)
def get_cenlar_mortgages(customerId: str, req: Request):
    global CURRENT_SCENARIO
    scenario = CURRENT_SCENARIO
    if hasattr(req, "session") and "mock_scenario" in req.session:
        scenario = req.session["mock_scenario"]

    if scenario == "error_cenlar":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cenlar API is currently unavailable",
        )

    if scenario in ["no_accounts", "single_account"]:
        return CenlarMortgagesResponse(mortgages=[], customerId=customerId)

    if scenario == "high_balance":
        return CenlarMortgagesResponse(
            mortgages=[
                CenlarMortgage(
                    id="cenlar-mtg-1",
                    accountNumber="MTG-800000",
                    balance=800000.00,
                    escrowBalance=15000.00,
                )
            ],
            customerId=customerId,
        )

    # default, delinquent, error_fiserv
    return CenlarMortgagesResponse(
        mortgages=[
            CenlarMortgage(
                id="cenlar-mtg-1",
                accountNumber="MTG-230000",
                balance=230000.00,
                escrowBalance=5000.00,
            )
        ],
        customerId=customerId,
    )
