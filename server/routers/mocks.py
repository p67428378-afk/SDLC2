from fastapi import APIRouter, HTTPException, status
from server.config import MOCK_STATE
from server.schemas import (
    FiservResponse,
    CenlarResponse,
    MockConfigRequest,
    MockConfigResponse,
    FiservAccount,
    CenlarMortgage,
)

router = APIRouter(prefix="/api/v1/mock", tags=["mocks"])


@router.post("/config", response_model=MockConfigResponse)
def configure_mock(payload: MockConfigRequest):
    valid_scenarios = ["default", "no accounts", "error states", "delinquent"]
    if payload.scenario not in valid_scenarios:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scenario. Must be one of {valid_scenarios}",
        )
    MOCK_STATE["scenario"] = payload.scenario
    return MockConfigResponse(scenario=payload.scenario, status="configured")


@router.get("/fiserv/accounts/{cifId}", response_model=FiservResponse)
def get_fiserv_accounts(cifId: str):
    scenario = MOCK_STATE["scenario"]

    if scenario == "error states":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fiserv Mock API Error",
        )

    if scenario == "no accounts":
        return FiservResponse(accounts=[], cifId=cifId)

    # Default or delinquent
    # Let's return standard accounts for CIF-98421
    if cifId == "CIF-98421":
        return FiservResponse(
            cifId=cifId,
            accounts=[
                FiservAccount(
                    id="fiserv-sav-1",
                    accountNumber="ACT-SAV-98421",
                    balance=85400.00,
                    type="Savings",
                ),
                FiservAccount(
                    id="fiserv-chk-1",
                    accountNumber="ACT-CHK-98421",
                    balance=12750.00,
                    type="Checking",
                ),
                FiservAccount(
                    id="fiserv-cd-1",
                    accountNumber="ACT-CD-98421",
                    balance=14000.00,
                    type="CD",
                ),
            ],
        )

    # Fallback for other CIFs
    return FiservResponse(
        cifId=cifId,
        accounts=[
            FiservAccount(
                id=f"fiserv-sav-{cifId}",
                accountNumber=f"ACT-SAV-{cifId}",
                balance=5000.00,
                type="Savings",
            )
        ],
    )


@router.get("/cenlar/mortgages/{customerId}", response_model=CenlarResponse)
def get_cenlar_mortgages(customerId: str):
    scenario = MOCK_STATE["scenario"]

    if scenario == "error states":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cenlar Mock API Error",
        )

    if scenario == "no accounts":
        return CenlarResponse(mortgages=[], customerId=customerId)

    # Default or delinquent
    if customerId == "CEN-55102":
        return CenlarResponse(
            customerId=customerId,
            mortgages=[
                CenlarMortgage(
                    id="cenlar-mort-1",
                    accountNumber="MTG-CEN-55102",
                    balance=230000.00,
                    escrowBalance=4500.00,
                )
            ],
        )

    # Fallback for other customer IDs
    return CenlarResponse(
        customerId=customerId,
        mortgages=[
            CenlarMortgage(
                id=f"cenlar-mort-{customerId}",
                accountNumber=f"MTG-CEN-{customerId}",
                balance=150000.00,
                escrowBalance=2000.00,
            )
        ],
    )
