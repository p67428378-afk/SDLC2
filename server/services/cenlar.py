from typing import List, Dict, Any, Optional
from datetime import datetime
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
                    "payment_history": [
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
                    ],
                }
            ]
        }

        # Seed borrower profiles
        self.borrower_profiles = {
            "CEN-554321": {
                "cenlar_customer_id": "CEN-554321",
                "address": "123 Financial Way, Suite 100, New York, NY 10001",
                "phone": "1-800-555-0199",
                "email": "test@example.com",
                "preferences": {
                    "paperless": True,
                    "email_notifications": True,
                    "sms_notifications": False,
                    "marketing_opt_in": False,
                },
            }
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
                if "payment_history" not in details:
                    details["payment_history"] = []
                return details
        return None

    def _find_mortgage(self, mortgage_account_id: str) -> Optional[Dict[str, Any]]:
        for cust_id, mort_list in self.mortgages.items():
            for mort in mort_list:
                if mort["id"] == mortgage_account_id:
                    return mort
        return None

    def process_payment(self, mortgage_account_id: str, amount: float) -> bool:
        mort = self._find_mortgage(mortgage_account_id)
        if not mort:
            return False
        principal_part = round(amount * 0.4, 2)
        interest_part = round(amount * 0.5, 2)
        escrow_part = round(amount - principal_part - interest_part, 2)

        mort["principal_balance"] = round(mort["principal_balance"] - principal_part, 2)
        if "payment_history" not in mort:
            mort["payment_history"] = []
        mort["payment_history"].insert(
            0,
            {
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "amount": amount,
                "principal": principal_part,
                "interest": interest_part,
                "escrow": escrow_part,
            },
        )
        return True

    def reverse_payment(self, mortgage_account_id: str, amount: float) -> bool:
        mort = self._find_mortgage(mortgage_account_id)
        if not mort:
            return False
        principal_part = round(amount * 0.4, 2)
        mort["principal_balance"] = round(mort["principal_balance"] + principal_part, 2)
        if "payment_history" not in mort:
            mort["payment_history"] = []
        if mort["payment_history"] and mort["payment_history"][0]["amount"] == amount:
            mort["payment_history"].pop(0)
        return True

    def get_borrower_profile(self, customer_id: str) -> Optional[Dict[str, Any]]:
        if customer_id not in self.borrower_profiles:
            self.borrower_profiles[customer_id] = {
                "cenlar_customer_id": customer_id,
                "address": "",
                "phone": "",
                "email": "",
                "preferences": {
                    "paperless": False,
                    "email_notifications": False,
                    "sms_notifications": False,
                    "marketing_opt_in": False,
                },
            }
        return self.borrower_profiles.get(customer_id)

    def update_borrower_profile(
        self, customer_id: str, address: str, phone: str, email: str
    ) -> bool:
        profile = self.get_borrower_profile(customer_id)
        if not profile:
            return False
        profile["address"] = address
        profile["phone"] = phone
        profile["email"] = email
        return True

    def update_correspondence_preferences(
        self, customer_id: str, preferences: Dict[str, bool]
    ) -> bool:
        profile = self.get_borrower_profile(customer_id)
        if not profile:
            return False
        if "preferences" not in profile:
            profile["preferences"] = {}
        profile["preferences"].update(preferences)
        return True
