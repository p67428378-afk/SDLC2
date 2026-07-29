from typing import List, Dict, Any, Optional
from server.services.base import MortgageService


class CenlarMockService(MortgageService):
    def __init__(self):
        # Seed data for mock mortgage servicing
        self.mortgages = {
            "CEN-554321": [
                {
                    "id": "cenlar-mort-1",
                    "name": "Home Mortgage",
                    "account_number": "•••• 1122",
                    "principal_balance": 345000.00,
                    "original_amount": 380000.00,
                    "interest_rate": 6.125,
                    "term_months": 360,
                    "maturity_date": "2056-06-01",
                    "escrow_balance": 8420.00,
                    "next_payment_amount": 2150.00,
                    "next_payment_due": "2026-06-01",
                    "status": "Active",
                }
            ]
        }

    def get_mortgages(self, customer_id: str) -> List[Dict[str, Any]]:
        return self.mortgages.get(customer_id, [])

    def get_mortgage_details(
        self, customer_id: str, account_id: str
    ) -> Optional[Dict[str, Any]]:
        user_mortgages = self.get_mortgages(customer_id)
        for mort in user_mortgages:
            if mort["id"] == account_id:
                details = mort.copy()
                details["escrow_breakdown"] = {
                    "property_tax": 4200.00,
                    "homeowners_insurance": 1800.00,
                    "mortgage_insurance": 0.00,
                    "cushion": 2420.00,
                }
                details["payment_history"] = [
                    {
                        "date": "2026-05-01",
                        "amount": 2150.00,
                        "principal": 850.00,
                        "interest": 1050.00,
                        "escrow": 250.00,
                    },
                    {
                        "date": "2026-04-01",
                        "amount": 2150.00,
                        "principal": 845.00,
                        "interest": 1055.00,
                        "escrow": 250.00,
                    },
                ]
                return details
        return None
