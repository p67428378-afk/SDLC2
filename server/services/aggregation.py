from fastapi import HTTPException, status, Request
from server.models import User
from server.routers.mocks import (
    get_fiserv_accounts,
    get_cenlar_mortgages,
    CURRENT_SCENARIO,
)
from server.schemas import AccountResponse, DashboardResponse


def aggregate_dashboard_data(user: User, req: Request) -> DashboardResponse:
    # Get the current scenario from session or global state
    scenario = CURRENT_SCENARIO
    if hasattr(req, "session") and "mock_scenario" in req.session:
        scenario = req.session["mock_scenario"]

    # 1. Fetch Fiserv accounts
    fiserv_accounts = []
    if user.fiserv_cif_id:
        try:
            res = get_fiserv_accounts(cifId=user.fiserv_cif_id, req=req)
            fiserv_accounts = res.accounts
        except HTTPException as e:
            if e.status_code == 503:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Downstream mock API error: Fiserv is unavailable",
                )
            raise e

    # 2. Fetch Cenlar mortgages
    cenlar_mortgages = []
    if user.cenlar_customer_id:
        try:
            res = get_cenlar_mortgages(customerId=user.cenlar_customer_id, req=req)
            cenlar_mortgages = res.mortgages
        except HTTPException as e:
            if e.status_code == 503:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Downstream mock API error: Cenlar is unavailable",
                )
            raise e

    # 3. Map to AccountResponse
    accounts = []
    total_deposits = 0.0
    total_mortgage = 0.0

    for acc in fiserv_accounts:
        name = "Fiserv Account"
        if acc.type == "Savings":
            name = "High-Yield Savings"
        elif acc.type == "Checking":
            name = "Primary Checking"
        elif acc.type == "CD":
            name = "12-Month CD"

        accounts.append(
            AccountResponse(
                id=acc.id,
                accountNumber=acc.accountNumber,
                name=name,
                institution="Fiserv",
                type=acc.type,
                balance=acc.balance,
                status="Active",
            )
        )
        total_deposits += acc.balance

    for mtg in cenlar_mortgages:
        status_str = "Delinquent" if scenario == "delinquent" else "Payment Due"
        accounts.append(
            AccountResponse(
                id=mtg.id,
                accountNumber=mtg.accountNumber,
                name="Home Mortgage",
                institution="Cenlar",
                type="Mortgage",
                balance=mtg.balance,
                status=status_str,
            )
        )
        total_mortgage += mtg.balance

    # Calculate net worth to match Stitch HTML: totalDeposits + totalMortgage
    net_worth = total_deposits + total_mortgage

    return DashboardResponse(
        accounts=accounts,
        netWorth=net_worth,
        totalDeposits=total_deposits,
        totalMortgage=total_mortgage,
    )
