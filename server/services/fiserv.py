import base64
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx

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


class FiservLiveService(FiservMockService):
    def __init__(self, settings):
        super().__init__()
        self.api_key = settings.FISERV_API_KEY
        self.api_secret = settings.FISERV_API_SECRET
        self.token_url = settings.FISERV_TOKEN_URL
        self.base_url = settings.FISERV_BASE_URL
        self.org_id = settings.FISERV_ORG_ID
        self.demo_accounts = settings.FISERV_DEMO_ACCOUNTS

        self._token = None
        self._token_expires_at = None

        self.accounts_to_query = []
        if self.demo_accounts:
            for item in self.demo_accounts.split(","):
                if ":" in item:
                    acct_id, acct_type = item.split(":", 1)
                    self.accounts_to_query.append(
                        {"id": acct_id.strip(), "type": acct_type.strip()}
                    )

    def _get_token(self) -> str:
        if self._token and (
            self._token_expires_at is None or datetime.utcnow() < self._token_expires_at
        ):
            return self._token

        credentials = f"{self.api_key}:{self.api_secret}"
        encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode(
            "utf-8"
        )
        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {"grant_type": "client_credentials"}

        response = httpx.post(self.token_url, headers=headers, data=data, timeout=10.0)
        if response.status_code != 200:
            headers["Content-Type"] = "application/json"
            response = httpx.post(
                self.token_url, headers=headers, json=data, timeout=10.0
            )

        response.raise_for_status()
        res_json = response.json()
        self._token = res_json["access_token"]
        expires_in = int(res_json.get("expires_in", 3600))
        self._token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 60)
        return self._token

    def _make_api_call(self, url: str, json_body: dict) -> dict:
        token = self._get_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json",
            "EFXHeader": json.dumps(
                {"OrganizationId": self.org_id, "TrnId": str(uuid.uuid4())}
            ),
            "Content-Type": "application/json",
        }

        response = httpx.post(url, headers=headers, json=json_body, timeout=10.0)
        if response.status_code == 401:
            self._token = None
            self._token_expires_at = None
            token = self._get_token()
            headers["Authorization"] = f"Bearer {token}"
            response = httpx.post(url, headers=headers, json=json_body, timeout=10.0)

        response.raise_for_status()
        return response.json()

    def get_accounts(self, cif: str) -> List[Dict[str, Any]]:
        accounts = []
        for acct in self.accounts_to_query:
            try:
                acct_id = acct["id"]
                acct_type = acct["type"]

                api_type = acct_type
                if acct_type in ("Savings", "SDA"):
                    api_type = "SDA"
                elif acct_type in ("CD", "CDA"):
                    api_type = "CDA"
                elif acct_type in ("Loan", "DDL"):
                    api_type = "DDL"
                elif acct_type == "DDA":
                    api_type = "DDA"

                # Exclude Loan accounts (DDL) in live mode
                if api_type == "DDL" or acct_type in ("Loan", "DDL"):
                    print(f"Excluding Loan account {acct_id} (DDL) in live mode.")
                    continue

                url = f"{self.base_url}/acctservice/acctmgmt/accounts/secured"
                body = {
                    "AcctSel": {
                        "AcctKeys": {
                            "AcctId": acct_id,
                            "AcctType": api_type,
                        }
                    }
                }

                res_json = self._make_api_call(url, body)

                # Inspect Status.StatusCode for business errors (HTTP 200 with non-zero StatusCode)
                status_info = res_json.get("Status", {})
                status_code = str(status_info.get("StatusCode", "0"))
                if status_code != "0":
                    status_desc = status_info.get("StatusDesc", "Business Error")
                    print(
                        f"Fiserv business error for account {acct_id}: StatusCode {status_code} - {status_desc}"
                    )
                    continue

                acct_rec = res_json.get("AcctRec", {})
                deposit_info = acct_rec.get("DepositAcctInfo", {})
                loan_info = acct_rec.get("LoanAcctInfo", {})
                info = deposit_info or loan_info

                acct_bal_list = info.get("AcctBal", [])
                if not isinstance(acct_bal_list, list):
                    acct_bal_list = [acct_bal_list] if acct_bal_list else []

                balance = 0.0
                for bal in acct_bal_list:
                    if bal.get("BalType") == "Current":
                        cur_amt = bal.get("CurAmt", {})
                        if cur_amt:
                            balance = float(cur_amt.get("Amt", 0.0))
                            break
                else:
                    if acct_bal_list:
                        cur_amt = acct_bal_list[0].get("CurAmt", {})
                        balance = float(cur_amt.get("Amt", 0.0))

                raw_rate = info.get("Rate", 0)
                try:
                    interest_rate = float(raw_rate)
                except (TypeError, ValueError):
                    interest_rate = 0.0

                status = info.get("AcctDtlStatus", "Unknown")

                type_labels = {
                    "DDA": "Checking Account",
                    "Savings": "Savings Account",
                    "SDA": "Savings Account",
                    "CD": "Certificate of Deposit",
                    "CDA": "Certificate of Deposit",
                }
                name = (
                    info.get("Nickname")
                    or info.get("AcctTitle")
                    or type_labels.get(acct_type, f"{acct_type} Account")
                )

                accounts.append(
                    {
                        "id": acct_id,
                        "name": name,
                        "type": acct_type,
                        "account_number": f"•••• {acct_id[-4:]}",
                        "balance": balance,
                        "interest_rate": interest_rate,
                        "status": status,
                        "transactions": [],
                    }
                )
            except Exception as e:
                print(f"Error fetching account {acct}: {str(e)}")
                continue

        return accounts

    def get_account_details(
        self, cif: str, account_id: str
    ) -> Optional[Dict[str, Any]]:
        accounts = self.get_accounts(cif)
        for acc in accounts:
            if acc["id"] == account_id:
                return acc
        return None

    def get_available_balance(self, account_id: str) -> Optional[float]:
        raise NotImplementedError("Payments are not supported in live mode.")

    def debit_account(self, account_id: str, amount: float) -> bool:
        raise NotImplementedError("Payments are not supported in live mode.")

    def credit_account(self, account_id: str, amount: float) -> bool:
        raise NotImplementedError("Payments are not supported in live mode.")

    def validate_account(self, account_id: str) -> bool:
        raise NotImplementedError("Payments are not supported in live mode.")


_service_instance = None


def get_core_banking_service() -> CoreBankingService:
    global _service_instance
    if _service_instance is not None:
        return _service_instance

    from server.config import settings

    if getattr(settings, "FISERV_MODE", "mock") == "live":
        _service_instance = FiservLiveService(settings)
    else:
        _service_instance = FiservMockService()
    return _service_instance
