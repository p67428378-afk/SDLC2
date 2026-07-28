from fastapi import APIRouter, Depends, HTTPException, status
from server.auth import get_current_user
from server.models import User
from server.schemas import AccountDetailsResponse
from server.services.aggregation import aggregate_accounts

router = APIRouter(prefix="/api/v1", tags=["accounts"])


@router.get("/accounts/{accountId}", response_model=AccountDetailsResponse)
def get_account_details(accountId: str, current_user: User = Depends(get_current_user)):
    # Get all aggregated accounts for the user
    dashboard_data = aggregate_accounts(
        fiserv_cif_id=current_user.fiserv_cif_id,
        cenlar_customer_id=current_user.cenlar_customer_id,
    )

    # Find the matching account
    target_account = None
    for acc in dashboard_data.accounts:
        if acc.id == accountId:
            target_account = acc
            break

    if not target_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    # Generate mock details based on account type
    details = {}
    if target_account.institution == "Fiserv":
        if target_account.type == "Savings":
            details = {
                "interestRate": "4.25%",
                "routingNumber": "123456789",
                "lastStatementDate": "2026-07-01",
                "transactions": [
                    {
                        "date": "2026-07-25",
                        "description": "Interest Payment",
                        "amount": 150.00,
                        "type": "Credit",
                    },
                    {
                        "date": "2026-07-10",
                        "description": "Transfer from Checking",
                        "amount": 1000.00,
                        "type": "Credit",
                    },
                ],
            }
        elif target_account.type == "Checking":
            details = {
                "interestRate": "0.05%",
                "routingNumber": "123456789",
                "lastStatementDate": "2026-07-01",
                "transactions": [
                    {
                        "date": "2026-07-27",
                        "description": "Grocery Store",
                        "amount": -85.40,
                        "type": "Debit",
                    },
                    {
                        "date": "2026-07-26",
                        "description": "Gas Station",
                        "amount": -45.00,
                        "type": "Debit",
                    },
                    {
                        "date": "2026-07-25",
                        "description": "Payroll Direct Deposit",
                        "amount": 3500.00,
                        "type": "Credit",
                    },
                ],
            }
        elif target_account.type == "CD":
            details = {
                "interestRate": "5.10%",
                "routingNumber": "123456789",
                "maturityDate": "2027-05-15",
                "term": "12 Months",
            }
    elif target_account.institution == "Cenlar":
        # Fetch escrow balance from Cenlar mock if possible, or use default
        escrow_balance = 4500.00
        if target_account.id == "cenlar-mort-1":
            escrow_balance = 4500.00

        details = {
            "interestRate": "6.50%",
            "escrowBalance": escrow_balance,
            "nextPaymentDueDate": "2026-08-01",
            "nextPaymentAmount": 1850.00,
            "term": "30 Years",
            "originationDate": "2020-05-15",
            "propertyAddress": "123 Main St, Anytown, USA",
        }

    return AccountDetailsResponse(
        id=target_account.id,
        accountNumber=target_account.accountNumber,
        balance=target_account.balance,
        institution=target_account.institution,
        name=target_account.name,
        status=target_account.status,
        type=target_account.type,
        details=details,
    )
