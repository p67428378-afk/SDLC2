from fastapi import APIRouter, Depends, HTTPException, status, Request
from server.auth import get_current_user
from server.models import User
from server.services.aggregation import aggregate_dashboard_data
from server.schemas import AccountDetailResponse

router = APIRouter(prefix="/api/v1", tags=["accounts"])


@router.get("/accounts/{accountId}", response_model=AccountDetailResponse)
def get_account_details(
    accountId: str, req: Request, current_user: User = Depends(get_current_user)
):
    # 1. Get all accounts for the user
    dashboard = aggregate_dashboard_data(current_user, req)

    # 2. Find the matching account
    target_account = None
    for acc in dashboard.accounts:
        if acc.id == accountId:
            target_account = acc
            break

    if not target_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    # 3. Generate mock details based on type
    details = {}
    if target_account.type == "Savings":
        details = {
            "interestRate": "4.25%",
            "routingNumber": "123456789",
            "statementDate": "2026-07-01",
            "availableBalance": target_account.balance,
        }
    elif target_account.type == "Checking":
        details = {
            "interestRate": "0.05%",
            "routingNumber": "123456789",
            "overdraftLimit": "$500.00",
            "availableBalance": target_account.balance,
        }
    elif target_account.type == "CD":
        details = {
            "interestRate": "5.10%",
            "maturityDate": "2027-07-28",
            "penalty": "Early withdrawal penalty applies",
        }
    elif target_account.type == "Mortgage":
        # Find the escrow balance from the mock Cenlar response if possible
        from server.routers.mocks import get_cenlar_mortgages

        escrow = 5000.00
        if current_user.cenlar_customer_id:
            try:
                res = get_cenlar_mortgages(
                    customerId=current_user.cenlar_customer_id, req=req
                )
                for m in res.mortgages:
                    if m.id == accountId:
                        escrow = m.escrowBalance
            except Exception:
                pass

        details = {
            "interestRate": "6.50%",
            "escrowBalance": f"${escrow:,.2f}",
            "nextPaymentDate": "2026-08-01",
            "monthlyPayment": "$1,500.00",
            "term": "30 Years Fixed",
        }

    return AccountDetailResponse(
        id=target_account.id,
        accountNumber=target_account.accountNumber,
        name=target_account.name,
        institution=target_account.institution,
        type=target_account.type,
        balance=target_account.balance,
        status=target_account.status,
        details=details,
    )
