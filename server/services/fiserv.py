from typing import List, Dict, Any, Optional
from datetime import datetime
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
                "preferences": {
                    "paperless": True,
                    "email_notif": True,
                    "sms_notif": False,
                    "marketing": True,
                },
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
                    "transactions": [
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
                    ],
                },
                {
                    "id": "fiserv-sav-1",
                    "name": "High-Yield Savings",
                    "type": "Savings",
                    "account_number": "•••• 8765",
                    "balance": 82780.00,
                    "interest_rate": 4.25,
                    "status": "Active",
                    "transactions": [],
                },
                {
                    "id": "fiserv-cd-1",
                    "name": "12-Month CD",
                    "type": "CD",
                    "account_number": "•••• 9912",
                    "balance": 50000.00,
                    "interest_rate": 5.10,
                    "status": "Active",
                    "transactions": [],
                },
                {
                    "id": "fiserv-loan-1",
                    "name": "Auto Loan",
                    "type": "Loan",
                    "account_number": "•••• 5543",
                    "balance": 15200.00,
                    "interest_rate": 3.45,
                    "status": "Active",
                    "transactions": [],
                },
            ]
        }

    def get_customer_profile(self, cif: str) -> Optional[Dict[str, Any]]:
        return self.profiles.get(cif)

    def update_customer_profile(
        self, cif: str, profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        profile = self.profiles.get(cif)
        if not profile:
            return {"success": False, "previous_state": {}}
        previous_state = {
            "address": profile.get("address"),
            "phone": profile.get("phone"),
            "email": profile.get("email"),
        }
        if "address" in profile_data:
            profile["address"] = profile_data["address"]
        if "phone" in profile_data:
            profile["phone"] = profile_data["phone"]
        if "email" in profile_data:
            profile["email"] = profile_data["email"]
        return {"success": True, "previous_state": previous_state}

    def update_communication_preferences(
        self, cif: str, preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        profile = self.profiles.get(cif)
        if not profile:
            return {"success": False, "previous_state": {}}
        if "preferences" not in profile:
            profile["preferences"] = {
                "paperless": True,
                "email_notif": True,
                "sms_notif": False,
                "marketing": True,
            }
        previous_state = profile["preferences"].copy()
        for k, v in preferences.items():
            profile["preferences"][k] = v
        return {"success": True, "previous_state": previous_state}

    def get_accounts(self, cif: str) -> List[Dict[str, Any]]:
        return self.accounts.get(cif, [])

    def get_account_details(
        self, cif: str, account_id: str
    ) -> Optional[Dict[str, Any]]:
        user_accounts = self.get_accounts(cif)
        for acc in user_accounts:
            if acc["id"] == account_id:
                details = acc.copy()
                if "transactions" not in details:
                    details["transactions"] = []
                return details
        return None

    def _find_account(self, account_id: str) -> Optional[Dict[str, Any]]:
        for cif, acc_list in self.accounts.items():
            for acc in acc_list:
                if acc["id"] == account_id:
                    return acc
        return None

    def validate_account(self, account_id: str) -> bool:
        acc = self._find_account(account_id)
        if not acc:
            return False
        return acc["type"] in ("DDA", "Savings") and acc["status"] == "Active"

    def get_available_balance(self, account_id: str) -> Optional[float]:
        acc = self._find_account(account_id)
        if not acc:
            return None
        return acc["balance"]

    def debit_account(self, account_id: str, amount: float) -> bool:
        acc = self._find_account(account_id)
        if not acc:
            return False
        if acc["balance"] < amount:
            return False
        acc["balance"] = round(acc["balance"] - amount, 2)
        if "transactions" not in acc:
            acc["transactions"] = []
        acc["transactions"].insert(
            0,
            {
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "description": "Mortgage Payment Debit",
                "amount": -amount,
                "type": "Debit",
            },
        )
        return True

    def credit_account(self, account_id: str, amount: float) -> bool:
        acc = self._find_account(account_id)
        if not acc:
            return False
        acc["balance"] = round(acc["balance"] + amount, 2)
        if "transactions" not in acc:
            acc["transactions"] = []
        acc["transactions"].insert(
            0,
            {
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "description": "Mortgage Payment Reversal",
                "amount": amount,
                "type": "Credit",
            },
        )
        return True

    def reset(self):
        self.__init__()
