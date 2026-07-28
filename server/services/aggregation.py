from typing import List
from fastapi import HTTPException, status
from server.config import MOCK_STATE
from server.routers.mocks import get_fiserv_accounts, get_cenlar_mortgages
from server.schemas import DashboardResponse, AccountSummary


def aggregate_accounts(
    fiserv_cif_id: str, cenlar_customer_id: str
) -> DashboardResponse:
    scenario = MOCK_STATE["scenario"]

    if scenario == "error states":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Downstream mock API error",
        )

    accounts: List[AccountSummary] = []
    total_deposits = 0.0
    total_mortgage = 0.0

    # 1. Fetch Fiserv Accounts
    if fiserv_cif_id:
        try:
            fiserv_data = get_fiserv_accounts(fiserv_cif_id)
            for acc in fiserv_data.accounts:
                name = (
                    "High-Yield Savings"
                    if acc.type == "Savings"
                    else (
                        "Primary Checking" if acc.type == "Checking" else "12-Month CD"
                    )
                )
                accounts.append(
                    AccountSummary(
                        id=acc.id,
                        accountNumber=acc.accountNumber,
                        balance=acc.balance,
                        institution="Fiserv",
                        name=name,
                        status="Active",
                        type=acc.type,
                    )
                )
                total_deposits += acc.balance
        except HTTPException as e:
            if scenario == "error states":
                raise e
            # Otherwise ignore or handle

    # 2. Fetch Cenlar Mortgages
    if cenlar_customer_id:
        try:
            cenlar_data = get_cenlar_mortgages(cenlar_customer_id)
            for mtg in cenlar_data.mortgages:
                status_str = "Delinquent" if scenario == "delinquent" else "Payment Due"
                accounts.append(
                    AccountSummary(
                        id=mtg.id,
                        accountNumber=mtg.accountNumber,
                        balance=mtg.balance,
                        institution="Cenlar",
                        name="Home Mortgage",
                        status=status_str,
                        type="Mortgage",
                    )
                )
                total_mortgage += mtg.balance
        except HTTPException as e:
            if scenario == "error states":
                raise e
            # Otherwise ignore or handle

    # Net Worth = Assets (Deposits) - Liabilities (Mortgage)
    net_worth = total_deposits - total_mortgage

    return DashboardResponse(
        accounts=accounts,
        netWorth=net_worth,
        totalDeposits=total_deposits,
        totalMortgage=total_mortgage,
    )
