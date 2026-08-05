import base64
import json
import re
import time
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


def _parse_address(raw_address: Any) -> Dict[str, str]:
    if isinstance(raw_address, dict):
        return {
            "Addr1": raw_address.get(
                "Addr1", raw_address.get("Line1", raw_address.get("address", ""))
            ),
            "City": raw_address.get("City", ""),
            "StateProv": raw_address.get("StateProv", raw_address.get("State", "")),
            "PostalCode": raw_address.get("PostalCode", ""),
        }

    if not isinstance(raw_address, str) or not raw_address.strip():
        return {
            "Addr1": "",
            "City": "",
            "StateProv": "",
            "PostalCode": "",
        }

    parts = [p.strip() for p in raw_address.split(",") if p.strip()]
    if len(parts) >= 3:
        line1 = ", ".join(parts[:-2])
        city = parts[-2]
        state_zip = parts[-1].split()
        state = state_zip[0] if len(state_zip) >= 1 else ""
        postal_code = state_zip[1] if len(state_zip) >= 2 else ""
        return {
            "Addr1": line1,
            "City": city,
            "StateProv": state,
            "PostalCode": postal_code,
        }
    elif len(parts) == 2:
        line1 = parts[0]
        rest = parts[1].split()
        city = rest[0] if len(rest) >= 1 else ""
        state = rest[1] if len(rest) >= 2 else ""
        postal_code = rest[2] if len(rest) >= 3 else ""
        return {
            "Addr1": line1,
            "City": city,
            "StateProv": state,
            "PostalCode": postal_code,
        }
    else:
        return {
            "Addr1": raw_address.strip(),
            "City": "",
            "StateProv": "",
            "PostalCode": "",
        }


def _extract_epreference_ident(res_json: dict) -> Optional[str]:
    if not isinstance(res_json, dict):
        return None

    status_rec = res_json.get("EPreferenceStatusRec", {})
    if isinstance(status_rec, dict):
        keys = status_rec.get("EPreferenceKeys", [])
        if isinstance(keys, list) and len(keys) > 0 and isinstance(keys[0], dict):
            ident = keys[0].get("EPreferenceIdent") or keys[0].get("ePreferenceIdent")
            if ident:
                return str(ident)
        elif isinstance(keys, dict):
            ident = keys.get("EPreferenceIdent") or keys.get("ePreferenceIdent")
            if ident:
                return str(ident)

    rec = res_json.get("EPreferenceRec", {})
    if isinstance(rec, dict):
        keys = rec.get("EPreferenceKeys", [])
        if isinstance(keys, list) and len(keys) > 0 and isinstance(keys[0], dict):
            ident = keys[0].get("EPreferenceIdent") or keys[0].get("ePreferenceIdent")
            if ident:
                return str(ident)
        elif isinstance(keys, dict):
            ident = keys.get("EPreferenceIdent") or keys.get("ePreferenceIdent")
            if ident:
                return str(ident)
        ident = rec.get("EPreferenceIdent") or rec.get("ePreferenceIdent")
        if ident:
            return str(ident)

    top_keys = res_json.get("EPreferenceKeys")
    if (
        isinstance(top_keys, list)
        and len(top_keys) > 0
        and isinstance(top_keys[0], dict)
    ):
        ident = top_keys[0].get("EPreferenceIdent") or top_keys[0].get(
            "ePreferenceIdent"
        )
        if ident:
            return str(ident)
    elif isinstance(top_keys, dict):
        ident = top_keys.get("EPreferenceIdent") or top_keys.get("ePreferenceIdent")
        if ident:
            return str(ident)

    return None


def _normalize_phone_for_fiserv(phone: Any) -> Optional[str]:
    """
    Render a phone number the way the Party service expects: +<country>-<area>-<rest>,
    exactly three dash-separated segments.

    Verified against the cert sandbox:
      "+1-217-5550143"   -> stored verbatim
      "2175550143"       -> HTTP 400, StatusCode 1090 "Invalid Value"
      "+1-217-555-0143"  -> accepted but silently mangled to "+1-217-0000555"
    So anything with the wrong segment count must be reshaped before sending.
    """
    if not phone:
        return None

    digits = re.sub(r"\D", "", str(phone))
    if not digits:
        return None

    # Drop a leading US country code so 11-digit input collapses to 10.
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]

    if len(digits) != 10:
        return None

    return f"+1-{digits[:3]}-{digits[3:]}"


def _extract_party_id_from_account(res_json: dict) -> Optional[str]:
    """
    Pull the Premier party (name) identifier out of an account inquiry response.

    Premier exposes it as PostAddr[].NameIdent, which is the numeric key the Party
    service expects as PartyId. The app's own CIF ("CIF-982341") is NOT a valid
    PartyId -- Fiserv rejects non-numeric keys with "Name Identification Must be
    Numeric" -- so the party has to be discovered from the account record instead.
    """
    if not isinstance(res_json, dict):
        return None

    acct_rec = res_json.get("AcctRec")
    if isinstance(acct_rec, dict):
        recs = [acct_rec]
    elif isinstance(acct_rec, list):
        recs = acct_rec
    else:
        return None

    for rec in recs:
        if not isinstance(rec, dict):
            continue
        info = rec.get("DepositAcctInfo") or rec.get("LoanAcctInfo") or {}
        if not isinstance(info, dict):
            continue

        post_addrs = info.get("PostAddr", [])
        if isinstance(post_addrs, dict):
            post_addrs = [post_addrs]
        if not isinstance(post_addrs, list):
            continue

        for post_addr in post_addrs:
            if not isinstance(post_addr, dict):
                continue
            idents = post_addr.get("NameIdent")
            if isinstance(idents, (str, int)):
                idents = [idents]
            if not isinstance(idents, list):
                continue
            for ident in idents:
                candidate = str(ident).strip()
                if candidate.isdigit():
                    return candidate

    return None


class FiservLiveService(FiservMockService):
    """
    Fiserv Live Integration Service using BankingHub cert sandbox APIs.

    TRACKED OPEN ITEM / SANDBOX FINDING:
    In the Fiserv cert sandbox environment, update calls to Party (/partyservice/parties/parties)
    and ePreferences (/epreferenceservice/epreference/ePreferences) may return entitlement or
    business errors due to branch-region / relationship-code entitlement restrictions on the cert org.
    Specifically, Party updates require OriginatingBranch, ResponsibleBranch, ResidenceCode, and
    valid PersonData relationships. If sandbox org entitlement limits or relationship codes reject
    the request, the service gracefully falls back to simulated local updates with fallback_reason
    and live_sync_available=False. Full live sync resolution requires Fiserv support or extended
    Add Party fields configured for the target organization.
    """

    _FRESH_TTL = timedelta(seconds=20)
    _STALE_TTL = timedelta(minutes=5)

    def __init__(self, settings):
        super().__init__()
        self.api_key = settings.FISERV_API_KEY
        self.api_secret = settings.FISERV_API_SECRET
        self.token_url = settings.FISERV_TOKEN_URL
        self.base_url = settings.FISERV_BASE_URL
        self.org_id = settings.FISERV_ORG_ID
        self.party_id = getattr(settings, "FISERV_PARTY_ID", None)
        self.demo_accounts = settings.FISERV_DEMO_ACCOUNTS

        self._token = None
        self._token_expires_at = None

        self._accounts_cache = None
        self._accounts_cache_at = None
        self._profile_cache = None
        self._profile_cache_at = None
        self._balance_adjustments: Dict[str, float] = {}

        # Party id discovered from the account record (see _resolve_party_id).
        self._resolved_party_id: Optional[str] = None
        # Outcome of the most recent live profile write, surfaced in GET metadata.
        self._last_live_sync: Optional[Dict[str, Any]] = None

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

    def _make_api_call(self, url: str, json_body: dict, method: str = "POST") -> dict:
        token = self._get_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json",
            "EFXHeader": json.dumps(
                {"OrganizationId": self.org_id, "TrnId": str(uuid.uuid4())}
            ),
            "Content-Type": "application/json",
        }

        if method.upper() == "PUT":
            response = httpx.put(url, headers=headers, json=json_body, timeout=10.0)
        else:
            response = httpx.post(url, headers=headers, json=json_body, timeout=10.0)

        if response.status_code == 401:
            self._token = None
            self._token_expires_at = None
            token = self._get_token()
            headers["Authorization"] = f"Bearer {token}"
            if method.upper() == "PUT":
                response = httpx.put(url, headers=headers, json=json_body, timeout=10.0)
            else:
                response = httpx.post(
                    url, headers=headers, json=json_body, timeout=10.0
                )

        response.raise_for_status()
        return response.json()

    def _call_with_retry(
        self, url: str, json_body: dict, attempts: int = 2, method: str = "POST"
    ) -> dict:
        last_exc: Optional[Exception] = None
        for attempt in range(attempts):
            try:
                return self._make_api_call(url, json_body, method=method)
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                last_exc = e
                if attempt < attempts - 1:
                    time.sleep(0.3)
        if last_exc is not None:
            raise last_exc
        raise RuntimeError("_call_with_retry called with attempts <= 0")

    def _resolve_party_id(self, cif: str) -> Optional[str]:
        """
        Resolve the Fiserv PartyId to update.

        Order of preference:
          1. FISERV_PARTY_ID, when an operator has pinned one explicitly.
          2. The NameIdent on the customer's primary (DDA) account record, which is
             already cached on each account as `raw_source` -- so this normally costs
             no extra API call.

        Returns None only when neither is available, in which case callers fall back
        to a simulated update rather than sending a request Fiserv will reject.
        """
        if self.party_id:
            return str(self.party_id)

        if self._resolved_party_id:
            return self._resolved_party_id

        try:
            accounts = self.get_accounts(cif)
        except Exception as e:
            print(f"[FISERV_PARTY_RESOLVE] Could not load accounts for {cif}: {e}")
            return None

        # Prefer the primary checking account, then fall back to any account.
        ordered = [a for a in accounts if a.get("type") == "DDA"] + [
            a for a in accounts if a.get("type") != "DDA"
        ]
        for acct in ordered:
            candidate = _extract_party_id_from_account(acct.get("raw_source") or {})
            if candidate:
                self._resolved_party_id = candidate
                print(
                    f"[FISERV_PARTY_RESOLVE] Resolved PartyId {candidate} from account "
                    f"{acct.get('id')} for CIF {cif}."
                )
                return candidate

        print(
            f"[FISERV_PARTY_RESOLVE] No numeric NameIdent found on any account for CIF {cif}."
        )
        return None

    def _fetch_party_contacts(self, party_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Read the party's current Contact collection.

        Required before any update: the Party PUT REPLACES the Contact collection
        rather than merging into it, so writing a partial list silently deletes the
        customer's other addresses, emails and phone numbers. Returns None when the
        collection can't be read, which callers must treat as "do not write".
        """
        url = f"{self.base_url}/partyservice/parties/parties/secured"
        body = {"PartySel": {"PartyKeys": {"PartyId": party_id}}}

        res_json = self._call_with_retry(url, body, method="POST")
        status_info = res_json.get("Status", {})
        if str(status_info.get("StatusCode", "0")) != "0":
            print(
                f"[FISERV_PARTY_READ] PartyId {party_id} inquiry returned StatusCode "
                f"{status_info.get('StatusCode')}: {status_info.get('StatusDesc')}."
            )
            return None

        party_rec = res_json.get("PartyRec")
        if isinstance(party_rec, list):
            party_rec = party_rec[0] if party_rec else {}
        if not isinstance(party_rec, dict):
            return None

        person_info = party_rec.get("PersonPartyInfo", {})
        if not isinstance(person_info, dict):
            return None
        person_data = person_info.get("PersonData", {})
        if not isinstance(person_data, dict):
            return None

        contacts = person_data.get("Contact", [])
        if isinstance(contacts, dict):
            contacts = [contacts]
        if not isinstance(contacts, list):
            return None

        return [c for c in contacts if isinstance(c, dict)]

    @staticmethod
    def _merge_contact_updates(
        contacts: List[Dict[str, Any]],
        parsed_addr: Dict[str, str],
        phone: Optional[str],
        email: Optional[str],
    ) -> List[Dict[str, Any]]:
        """
        Rebuild the full Contact collection with only the customer-editable fields
        changed, preserving every existing record and its identifier.

        The identifiers matter: a PostAddr without its AddressIdent is rejected with
        StatusCode 1020 "Required Element Not Included", and an Email without its
        EmailIdent is appended as a brand new address instead of updating in place.
        """
        merged: List[Dict[str, Any]] = []
        addr_done = False
        email_done = False
        phone_done = False

        for contact in contacts:
            entry = json.loads(json.dumps(contact))  # deep copy, plain JSON in/out

            if "PostAddr" in entry and not addr_done:
                post_addr = entry["PostAddr"]
                if isinstance(post_addr, dict) and post_addr.get("AddressIdent"):
                    post_addr["Addr1"] = parsed_addr.get("Addr1", "")
                    post_addr["Addr2"] = ""
                    post_addr["City"] = parsed_addr.get("City", "")
                    post_addr["StateProv"] = parsed_addr.get("StateProv", "")
                    post_addr["PostalCode"] = parsed_addr.get("PostalCode", "")
                    addr_done = True

            elif "Email" in entry and not email_done and email:
                email_obj = entry["Email"]
                if isinstance(email_obj, dict) and email_obj.get("EmailIdent"):
                    email_obj["EmailAddr"] = email
                    email_done = True

            elif "PhoneNum" in entry and not phone_done and phone:
                phone_obj = entry["PhoneNum"]
                if isinstance(phone_obj, dict):
                    phone_obj["Phone"] = phone
                    phone_done = True

            merged.append(entry)

        # The sandbox party may carry no email/phone contact at all; add one so the
        # customer's new details are still recorded.
        if email and not email_done:
            merged.append(
                {
                    "Email": {
                        "EmailType": "Person",
                        "EmailAddr": email,
                        "PreferredEmail": True,
                    }
                }
            )
        if phone and not phone_done:
            merged.append(
                {
                    "PhoneNum": {
                        "PhoneType": "Mobile",
                        "Phone": phone,
                        "PreferredPhone": True,
                    }
                }
            )

        return merged

    def _parse_party_response(
        self, res_json: dict, cif: str, party_id: str
    ) -> Dict[str, Any]:
        mock_profile = super().get_customer_profile(cif) or {}

        party_rec = res_json.get("PartyRec", {})
        if not isinstance(party_rec, dict):
            party_rec = res_json

        person_info = party_rec.get("PersonPartyInfo", {})
        person_data = (
            person_info.get("PersonData", {}) if isinstance(person_info, dict) else {}
        )

        first_name = mock_profile.get("first_name", "Jane")
        last_name = mock_profile.get("last_name", "Doe")
        names = person_data.get("PersonName", [])
        if isinstance(names, list) and len(names) > 0 and isinstance(names[0], dict):
            first_name = names[0].get("GivenName") or first_name
            last_name = names[0].get("FamilyName") or last_name

        email = mock_profile.get("email", "test@example.com")
        phone = mock_profile.get("phone", "1-800-555-0199")
        address = mock_profile.get("address", "")

        contacts = person_data.get("Contact", [])
        if isinstance(contacts, list):
            for contact in contacts:
                if not isinstance(contact, dict):
                    continue
                if "Email" in contact and isinstance(contact["Email"], dict):
                    email = contact["Email"].get("EmailAddr") or email
                elif "PhoneNum" in contact and isinstance(contact["PhoneNum"], dict):
                    phone = contact["PhoneNum"].get("Phone") or phone
                elif "PostAddr" in contact and isinstance(contact["PostAddr"], dict):
                    addr_obj = contact["PostAddr"]
                    line1 = addr_obj.get("Addr1", "")
                    city = addr_obj.get("City", "")
                    state = addr_obj.get("StateProv", "")
                    zip_code = addr_obj.get("PostalCode", "")
                    addr_str = f"{line1}, {city}, {state} {zip_code}".strip(", ")
                    if addr_str:
                        address = addr_str

        return {
            "cif": cif,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "address": address,
            "relationship_manager": mock_profile.get(
                "relationship_manager", "Robert Vance"
            ),
            "preferences": mock_profile.get(
                "preferences",
                {
                    "paperless": True,
                    "email_notif": True,
                    "sms_notif": False,
                    "marketing": True,
                },
            ),
            "metadata": {
                "fiserv_sync": "LIVE_SUCCESS",
                "live_sync_available": True,
                "fallback_reason": None,
            },
        }

    def get_customer_profile(self, cif: str) -> Optional[Dict[str, Any]]:
        """
        Return the customer's profile from local state.

        This deliberately does NOT read the Party service. The cert-sandbox party
        behind the demo accounts is a different person -- Premier party 3328719 is
        "HOWARD FEN", while the app's demo customer is Jane Doe -- so mapping live
        party fields onto the profile would silently replace the customer's identity.
        It would also add a Party round-trip to every profile page load.

        Writes still go to Fiserv for real (see update_customer_profile); the outcome
        of the most recent write is reported in `metadata` so callers can tell whether
        the last change actually reached the core.
        """
        mock_profile = super().get_customer_profile(cif)
        if not mock_profile:
            return None

        res = mock_profile.copy()
        last = self._last_live_sync

        if last is None:
            # Nothing written yet in this process; report honestly without spending
            # API calls just to populate a status field.
            party_known = bool(self.party_id or self._resolved_party_id)
            res["metadata"] = {
                "fiserv_sync": "LIVE_READY" if party_known else "NOT_YET_SYNCED",
                "live_sync_available": party_known,
                "fallback_reason": None,
            }
        else:
            live_ok = bool(last.get("ok"))
            res["metadata"] = {
                "fiserv_sync": "LIVE_SUCCESS" if live_ok else "FALLBACK_SIMULATED",
                "live_sync_available": live_ok,
                "fallback_reason": last.get("reason"),
            }

        return res

    def update_customer_profile(
        self, cif: str, profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        profile = self.profiles.get(cif, {})
        previous_state = {
            "address": profile.get("address"),
            "phone": profile.get("phone"),
            "email": profile.get("email"),
        }

        party_id = self._resolve_party_id(cif)
        if not party_id:
            print(
                f"[FISERV_PARTY_GATED] Organization ID {self.org_id} - no PartyId could be "
                f"resolved for CIF {cif}. Skipping live HTTP call."
            )
            super().update_customer_profile(cif, profile_data)
            self._profile_cache = None
            self._last_live_sync = {"ok": False, "reason": "PARTY_ID_UNRESOLVED"}
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": "PARTY_ID_UNRESOLVED",
            }

        url = f"{self.base_url}/partyservice/parties/parties"

        raw_address = profile_data.get("address", profile.get("address", ""))
        parsed_addr = _parse_address(raw_address)

        new_phone = _normalize_phone_for_fiserv(
            profile_data.get("phone", profile.get("phone", ""))
        )
        new_email = profile_data.get("email", profile.get("email", ""))

        # Read the current contacts before writing. The PUT replaces the Contact
        # collection wholesale, so we must send every existing record back with its
        # identifier intact -- otherwise the customer's other addresses and emails are
        # deleted as a side effect of changing one field.
        try:
            existing_contacts = self._fetch_party_contacts(party_id)
        except Exception as e:
            print(
                f"[FISERV_PARTY_READ] Could not read contacts for PartyId {party_id}: {e}. "
                f"Falling back to simulated update rather than risking a partial write."
            )
            existing_contacts = None

        if existing_contacts is None:
            super().update_customer_profile(cif, profile_data)
            self._profile_cache = None
            self._last_live_sync = {"ok": False, "reason": "PARTY_READ_FAILED"}
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": "PARTY_READ_FAILED",
            }

        contacts = self._merge_contact_updates(
            existing_contacts, parsed_addr, new_phone, new_email
        )

        # PartyKeys + Contact only. Including OriginatingBranch / ResponsibleBranch /
        # ResidenceCode or PersonName makes Premier reject the whole request with
        # StatusCode 1020 "Required Element Not Included" / ServerStatusCode 103
        # "Invalid Branch Region" -- reproduced with both the hardcoded branch "1" and
        # the party's own branch "2". Name is not user-editable here, so omitting it
        # costs nothing.
        body = {
            "OvrdAutoAckInd": "true",
            "PartyKeys": {"PartyId": party_id},
            "PersonPartyInfo": {"PersonData": {"Contact": contacts}},
        }

        try:
            res_json = self._call_with_retry(url, body, method="PUT")
            status_info = res_json.get("Status", {})
            status_code = str(status_info.get("StatusCode", "0"))
            if status_code != "0":
                status_desc = status_info.get("StatusDesc", "Business Error")
                if (
                    status_code in ("401", "403", "404", "1120")
                    or "entitle" in status_desc.lower()
                    or "not authorized" in status_desc.lower()
                    or "permission" in status_desc.lower()
                ):
                    fallback_reason = "ENTITLEMENT_DENIED"
                else:
                    fallback_reason = "BUSINESS_ERROR"

                print(
                    f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} endpoint {url} (StatusCode {status_code}: {status_desc}). Reason: {fallback_reason}. Falling back to simulated update."
                )
                super().update_customer_profile(cif, profile_data)
                self._profile_cache = None
                self._last_live_sync = {"ok": False, "reason": fallback_reason}
                return {
                    "success": True,
                    "previous_state": previous_state,
                    "live_sync_available": False,
                    "fallback_reason": fallback_reason,
                }

            print(
                f"[FISERV_PARTY_LIVE_OK] Organization ID {self.org_id} updated PartyId "
                f"{party_id} on {url} (StatusCode 0)."
            )
            super().update_customer_profile(cif, profile_data)
            self._profile_cache = None
            self._last_live_sync = {"ok": True, "reason": None}

            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": True,
                "fallback_reason": None,
            }

        except httpx.HTTPStatusError as e:
            code = e.response.status_code if e.response is not None else 500
            code_str = str(code)
            if code in (401, 403, 404):
                fallback_reason = "ENTITLEMENT_DENIED"
            elif 400 <= code < 500:
                fallback_reason = "BUSINESS_ERROR"
            else:
                fallback_reason = "UPSTREAM_ERROR"

            print(
                f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} HTTP error for endpoint {url} (HTTP {code_str}). Reason: {fallback_reason}. Falling back to simulated update."
            )
            super().update_customer_profile(cif, profile_data)
            self._profile_cache = None
            self._last_live_sync = {"ok": False, "reason": fallback_reason}
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": fallback_reason,
            }
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            print(
                f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} network error for endpoint {url}: {str(e)}. Falling back to simulated update."
            )
            super().update_customer_profile(cif, profile_data)
            self._profile_cache = None
            self._last_live_sync = {"ok": False, "reason": "NETWORK_ERROR"}
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": "NETWORK_ERROR",
            }
        except Exception as e:
            print(
                f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} unexpected error for endpoint {url}: {str(e)}. Falling back to simulated update."
            )
            super().update_customer_profile(cif, profile_data)
            self._profile_cache = None
            self._last_live_sync = {"ok": False, "reason": "UPSTREAM_ERROR"}
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": "UPSTREAM_ERROR",
            }

    def update_communication_preferences(
        self, cif: str, preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        profile = self.profiles.get(cif, {})
        cur_prefs = profile.get("preferences", {})
        previous_state = cur_prefs.copy()

        # No PartyId gate here: the ePreference service is keyed by account
        # (EPreferenceSel.AcctKeys), not by party, so preferences can sync even when no
        # PartyId is resolvable.

        # a) Find customer's DDA checking account ID
        accounts = self.get_accounts(cif)
        dda_id = None
        for acc in accounts:
            if acc.get("type") == "DDA":
                dda_id = acc.get("id")
                break

        if not dda_id and self.accounts_to_query:
            for item in self.accounts_to_query:
                if item.get("type") == "DDA":
                    dda_id = item.get("id")
                    break

        if not dda_id:
            print(
                f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} - No DDA checking account found for CIF {cif}. Falling back to simulated update."
            )
            super().update_communication_preferences(cif, preferences)
            self._profile_cache = None
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": "NO_DDA_ACCOUNT",
            }

        email = profile.get("email", "test@example.com")
        paperless = preferences.get("paperless", True)
        email_notif = preferences.get("email_notif", True)

        try:
            # b) Check existing ident via POST /epreferenceservice/epreference/ePreferences/secured
            secured_url = (
                f"{self.base_url}/epreferenceservice/epreference/ePreferences/secured"
            )
            secured_body = {
                "EPreferenceSel": {
                    "AcctKeys": {
                        "AcctId": dda_id,
                        "AcctType": "DDA",
                    }
                }
            }

            ident = None
            try:
                sec_res = self._call_with_retry(
                    secured_url, secured_body, method="POST"
                )
                status_info = sec_res.get("Status", {})
                status_code = str(status_info.get("StatusCode", "0"))
                if status_code == "0":
                    ident = _extract_epreference_ident(sec_res)
                elif status_code in ("401", "403", "404", "1120"):
                    status_desc = status_info.get("StatusDesc", "")
                    print(
                        f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} endpoint {secured_url} (StatusCode {status_code}: {status_desc}). Falling back to simulated update."
                    )
                    super().update_communication_preferences(cif, preferences)
                    self._profile_cache = None
                    return {
                        "success": True,
                        "previous_state": previous_state,
                        "live_sync_available": False,
                        "fallback_reason": "ENTITLEMENT_DENIED",
                    }
            except httpx.HTTPStatusError as e:
                code = e.response.status_code if e.response is not None else 500
                if code in (401, 403, 404):
                    fallback_reason = "ENTITLEMENT_DENIED"
                elif 400 <= code < 500:
                    fallback_reason = "BUSINESS_ERROR"
                else:
                    fallback_reason = "UPSTREAM_ERROR"
                print(
                    f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} HTTP error for endpoint {secured_url} (HTTP {code}). Reason: {fallback_reason}. Falling back to simulated update."
                )
                super().update_communication_preferences(cif, preferences)
                self._profile_cache = None
                return {
                    "success": True,
                    "previous_state": previous_state,
                    "live_sync_available": False,
                    "fallback_reason": fallback_reason,
                }

            # c) If no ident found, create ident via POST /epreferenceservice/epreference/ePreferences
            if not ident:
                create_url = (
                    f"{self.base_url}/epreferenceservice/epreference/ePreferences"
                )
                create_email_link = (
                    [
                        {
                            "Email": {
                                "EmailType": "Person",
                                "EmailAddr": email,
                                "PreferredEmail": True,
                            }
                        }
                    ]
                    if email
                    else []
                )
                create_body = {
                    "EPreferenceInfo": {
                        "OverrideException": True,
                        "AcctKeys": {
                            "AcctId": dda_id,
                            "AcctType": "DDA",
                        },
                        "DocGroupName": 2,
                        "StmtPrepCode": 1,
                        "StmtTruncationOption": 1,
                        "EmailLink": create_email_link,
                    }
                }
                try:
                    create_res = self._call_with_retry(
                        create_url, create_body, method="POST"
                    )
                    status_info = create_res.get("Status", {})
                    status_code = str(status_info.get("StatusCode", "0"))
                    if status_code != "0":
                        status_desc = status_info.get("StatusDesc", "Business Error")
                        if (
                            status_code in ("401", "403", "404", "1120")
                            or "entitle" in status_desc.lower()
                            or "not authorized" in status_desc.lower()
                            or "permission" in status_desc.lower()
                        ):
                            fallback_reason = "ENTITLEMENT_DENIED"
                        else:
                            fallback_reason = "BUSINESS_ERROR"

                        print(
                            f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} endpoint {create_url} (StatusCode {status_code}: {status_desc}). Reason: {fallback_reason}. Falling back to simulated update."
                        )
                        super().update_communication_preferences(cif, preferences)
                        self._profile_cache = None
                        return {
                            "success": True,
                            "previous_state": previous_state,
                            "live_sync_available": False,
                            "fallback_reason": fallback_reason,
                        }

                    ident = _extract_epreference_ident(create_res)
                except httpx.HTTPStatusError as e:
                    code = e.response.status_code if e.response is not None else 500
                    if code in (401, 403, 404):
                        fallback_reason = "ENTITLEMENT_DENIED"
                    elif 400 <= code < 500:
                        fallback_reason = "BUSINESS_ERROR"
                    else:
                        fallback_reason = "UPSTREAM_ERROR"
                    print(
                        f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} HTTP error for endpoint {create_url} (HTTP {code}). Reason: {fallback_reason}. Falling back to simulated update."
                    )
                    super().update_communication_preferences(cif, preferences)
                    self._profile_cache = None
                    return {
                        "success": True,
                        "previous_state": previous_state,
                        "live_sync_available": False,
                        "fallback_reason": fallback_reason,
                    }

            if not ident:
                ident = "default-epref-ident"

            # d) Update preference via PUT /epreferenceservice/epreference/ePreferences
            put_url = f"{self.base_url}/epreferenceservice/epreference/ePreferences"
            email_link = (
                [
                    {
                        "Email": {
                            "EmailType": "Person",
                            "EmailAddr": email,
                            "PreferredEmail": True,
                        }
                    }
                ]
                if email_notif
                else []
            )

            put_body = {
                "OverrideException": True,
                "EPreferenceKeys": {
                    "AcctKeys": {
                        "AcctId": dda_id,
                        "AcctType": "DDA",
                    },
                    "ePreferenceIdent": ident,
                },
                "EPreferenceInfo": {
                    "CombinedStmtInd": paperless,
                    "EmailLink": email_link,
                },
            }

            put_res = self._call_with_retry(put_url, put_body, method="PUT")
            status_info = put_res.get("Status", {})
            status_code = str(status_info.get("StatusCode", "0"))
            if status_code != "0":
                status_desc = status_info.get("StatusDesc", "Business Error")
                if (
                    status_code in ("401", "403", "404", "1120")
                    or "entitle" in status_desc.lower()
                    or "not authorized" in status_desc.lower()
                    or "permission" in status_desc.lower()
                ):
                    fallback_reason = "ENTITLEMENT_DENIED"
                else:
                    fallback_reason = "BUSINESS_ERROR"

                print(
                    f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} endpoint {put_url} (StatusCode {status_code}: {status_desc}). Reason: {fallback_reason}. Falling back to simulated update."
                )
                super().update_communication_preferences(cif, preferences)
                self._profile_cache = None
                return {
                    "success": True,
                    "previous_state": previous_state,
                    "live_sync_available": False,
                    "fallback_reason": fallback_reason,
                }

            super().update_communication_preferences(cif, preferences)
            self._profile_cache = None

            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": True,
                "fallback_reason": None,
                "partial_fiserv_sync": ["sms_notif", "marketing"],
            }

        except httpx.HTTPStatusError as e:
            code = e.response.status_code if e.response is not None else 500
            code_str = str(code)
            if code in (401, 403, 404):
                fallback_reason = "ENTITLEMENT_DENIED"
            elif 400 <= code < 500:
                fallback_reason = "BUSINESS_ERROR"
            else:
                fallback_reason = "UPSTREAM_ERROR"
            print(
                f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} HTTP error for ePreferences endpoint (HTTP {code_str}). Reason: {fallback_reason}. Falling back to simulated update."
            )
            super().update_communication_preferences(cif, preferences)
            self._profile_cache = None
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": fallback_reason,
            }
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            print(
                f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} network error for ePreferences endpoint: {str(e)}. Falling back to simulated update."
            )
            super().update_communication_preferences(cif, preferences)
            self._profile_cache = None
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": "NETWORK_ERROR",
            }
        except Exception as e:
            print(
                f"[FISERV_ENTITLEMENT_FALLBACK] Organization ID {self.org_id} unexpected error for ePreferences endpoint: {str(e)}. Falling back to simulated update."
            )
            super().update_communication_preferences(cif, preferences)
            self._profile_cache = None
            return {
                "success": True,
                "previous_state": previous_state,
                "live_sync_available": False,
                "fallback_reason": "UPSTREAM_ERROR",
            }

    def get_accounts(self, cif: str) -> List[Dict[str, Any]]:
        now = datetime.utcnow()
        if (
            self._accounts_cache is not None
            and self._accounts_cache_at is not None
            and now - self._accounts_cache_at < self._FRESH_TTL
        ):
            return self._accounts_cache

        fresh_accounts = self._fetch_accounts_live(cif)

        expected = len(
            [a for a in self.accounts_to_query if a["type"] not in ("Loan", "DDL")]
        )
        if (
            len(fresh_accounts) < expected
            and self._accounts_cache is not None
            and self._accounts_cache_at is not None
            and now - self._accounts_cache_at < self._STALE_TTL
        ):
            print(
                f"Fiserv live fetch returned {len(fresh_accounts)}/{expected} accounts; "
                f"serving last known-good snapshot from {self._accounts_cache_at.isoformat()}."
            )
            return self._accounts_cache

        self._accounts_cache = fresh_accounts
        self._accounts_cache_at = now
        return fresh_accounts

    def _fetch_accounts_live(self, cif: str) -> List[Dict[str, Any]]:
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

                res_json = self._call_with_retry(url, body)

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

                balance = round(
                    balance + self._balance_adjustments.get(acct_id, 0.0), 2
                )

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
                        "raw_source": res_json,
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

    def _find_live_account(self, account_id: str) -> Optional[Dict[str, Any]]:
        for acc in self.get_accounts(""):
            if acc["id"] == account_id:
                return acc
        return None

    def _apply_balance_adjustment(self, account_id: str, delta: float) -> None:
        self._balance_adjustments[account_id] = round(
            self._balance_adjustments.get(account_id, 0.0) + delta, 2
        )
        if self._accounts_cache:
            for acc in self._accounts_cache:
                if acc["id"] == account_id:
                    acc["balance"] = round(acc["balance"] + delta, 2)
                    break

    def get_available_balance(self, account_id: str) -> Optional[float]:
        acc = self._find_live_account(account_id)
        if not acc:
            return None
        return acc["balance"]

    def debit_account(self, account_id: str, amount: float) -> bool:
        acc = self._find_live_account(account_id)
        if not acc or acc["balance"] < amount:
            return False
        self._apply_balance_adjustment(account_id, -amount)
        return True

    def credit_account(self, account_id: str, amount: float) -> bool:
        acc = self._find_live_account(account_id)
        if not acc:
            return False
        self._apply_balance_adjustment(account_id, amount)
        return True

    def validate_account(self, account_id: str) -> bool:
        acc = self._find_live_account(account_id)
        if not acc:
            return False
        return acc["type"] in ("DDA", "Savings") and acc["status"] == "Active"


_service_instance: Optional[CoreBankingService] = None


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
