from typing import List, Dict, Any, Optional
from server.services.base import CoreBankingService


class FiservMockService(CoreBankingService):
    def __init__(self):
        # Seed data for mock core banking
        self.profiles = {
            "CIF-982341": {
                "cif": "CIF-982341",
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "test@example.com",
                "phone": "1-800-555-0199",
                "address": "123 Financial Way, Suite 100, New York, NY 10001",
                "relationship_manager": "Robert Vance",
            }
        }

        self.accounts = {
            "CIF-982341": [
                {
                    "id": "fiserv-dda-1",
                    "name": "Primary Checking",
                    "type": "DDA",
                    "account_number": "•••• 4321",
                    "balance": 12450.00,
                    "interest_rate": 0.05,
                    "status": "Active",
                },
                {
                    "id": "fiserv-sav-1",
                    "name": "High-Yield Savings",
                    "type": "Savings",
                    "account_number": "•••• 8765",
                    "balance": 82780.00,
                    "interest_rate": 4.25,
                    "status": "Active",
                },
                {
                    "id": "fiserv-cd-1",
                    "name": "12-Month CD",
                    "type": "CD",
                    "account_number": "•••• 9912",
                    "balance": 50000.00,
                    "interest_rate": 5.10,
                    "status": "Active",
                },
                {
                    "id": "fiserv-loan-1",
                    "name": "Auto Loan",
                    "type": "Loan",
                    "account_number": "•••• 5543",
                    "balance": 15200.00,
                    "interest_rate": 3.45,
                    "status": "Active",
                },
            ]
        }

    def get_customer_profile(self, cif: str) -> Optional[Dict[str, Any]]:
        return self.profiles.get(cif)

    def get_accounts(self, cif: str) -> List[Dict[str, Any]]:
        return self.accounts.get(cif, [])

    def get_account_details(
        self, cif: str, account_id: str
    ) -> Optional[Dict[str, Any]]:
        user_accounts = self.get_accounts(cif)
        for acc in user_accounts:
            if acc["id"] == account_id:
                # Return detailed view (can include extra mock fields like transactions)
                details = acc.copy()
                details["transactions"] = [
                    {
                        "date": "2026-05-15",
                        "description": "Payroll Direct Deposit",
                        "amount": 3500.00,
                        "type": "Credit",
                    },
                    {
                        "date": "2026-05-14",
                        "description": "Grocery Store",
                        "amount": -124.50,
                        "type": "Debit",
                    },
                    {
                        "date": "2026-05-12",
                        "description": "Electric Utility",
                        "amount": -85.20,
                        "type": "Debit",
                    },
                ]
                return details
        return None
