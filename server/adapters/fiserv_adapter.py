import logging

logger = logging.getLogger(__name__)

# Mock Fiserv Account Database
MOCK_FISERV_ACCOUNTS = {
    "ACC-1111": {
        "accountId": "ACC-1111",
        "accountName": "Primary Checking",
        "accountType": "DDA",
        "balance": 5000.00,
        "status": "ACTIVE",
        "eligible_for_debit": True,
    },
    "ACC-2222": {
        "accountId": "ACC-2222",
        "accountName": "Regular Savings",
        "accountType": "SAVINGS",
        "balance": 50.00,
        "status": "ACTIVE",
        "eligible_for_debit": True,
    },
    "ACC-3333": {
        "accountId": "ACC-3333",
        "accountName": "Frozen Checking",
        "accountType": "DDA",
        "balance": 10000.00,
        "status": "FROZEN",
        "eligible_for_debit": False,
    },
    "ACC-4444": {
        "accountId": "ACC-4444",
        "accountName": "Premium Checking",
        "accountType": "DDA",
        "balance": 25000.00,
        "status": "ACTIVE",
        "eligible_for_debit": True,
    },
}

# In-memory store for mock transactions to support idempotency and reconciliation
MOCK_FISERV_TRANSACTIONS = {}


class FiservAdapter:
    def __init__(self):
        pass

    def get_eligible_accounts(self) -> list:
        """Retrieve all eligible DDA/Savings accounts."""
        return [
            acc for acc in MOCK_FISERV_ACCOUNTS.values() if acc["eligible_for_debit"]
        ]

    def validate_account(self, account_id: str) -> dict:
        """Validate that the selected source account is active and eligible for debit."""
        logger.info(f"Fiserv: Validating account {account_id}")
        if account_id not in MOCK_FISERV_ACCOUNTS:
            raise ValueError(f"Account {account_id} not found in Fiserv")

        account = MOCK_FISERV_ACCOUNTS[account_id]
        if account["status"] != "ACTIVE":
            raise ValueError(f"Account {account_id} is {account['status']}")
        if not account["eligible_for_debit"]:
            raise ValueError(f"Account {account_id} is not eligible for debit")

        return account

    def get_balance(self, account_id: str) -> float:
        """Retrieve the available balance for the account."""
        logger.info(f"Fiserv: Balance inquiry for account {account_id}")
        account = self.validate_account(account_id)
        return account["balance"]

    def debit_account(
        self, account_id: str, amount: float, idempotency_key: str
    ) -> str:
        """Debit funds from the account."""
        logger.info(
            f"Fiserv: Debiting {amount} from {account_id} with key {idempotency_key}"
        )

        # Idempotency check
        if idempotency_key in MOCK_FISERV_TRANSACTIONS:
            tx = MOCK_FISERV_TRANSACTIONS[idempotency_key]
            logger.info(
                f"Fiserv: Duplicate request detected. Returning existing transaction {tx['tx_id']}"
            )
            if tx["status"] == "FAILED":
                raise ValueError(tx["error"])
            return tx["tx_id"]

        account = self.validate_account(account_id)

        # Simulate timeout/unknown state for ACC-4444 if amount is exactly 999.00 (or just for ACC-4444)
        if account_id == "ACC-4444" and amount == 999.00:
            MOCK_FISERV_TRANSACTIONS[idempotency_key] = {
                "status": "UNKNOWN",
                "tx_id": None,
                "amount": amount,
                "account_id": account_id,
                "error": "Timeout connecting to Fiserv",
            }
            raise TimeoutError("Fiserv connection timed out")

        if account["balance"] < amount:
            MOCK_FISERV_TRANSACTIONS[idempotency_key] = {
                "status": "FAILED",
                "tx_id": None,
                "amount": amount,
                "account_id": account_id,
                "error": "Insufficient funds",
            }
            raise ValueError("Insufficient funds")

        # Perform debit
        account["balance"] -= amount
        tx_id = f"FT-FISERV-{idempotency_key[-12:]}"
        MOCK_FISERV_TRANSACTIONS[idempotency_key] = {
            "status": "SUCCESS",
            "tx_id": tx_id,
            "amount": amount,
            "account_id": account_id,
        }
        return tx_id

    def reverse_debit(
        self,
        account_id: str,
        amount: float,
        original_transaction_id: str,
        idempotency_key: str,
    ) -> str:
        """Reverse a previous debit (compensating transaction)."""
        logger.info(
            f"Fiserv: Reversing debit of {amount} for {account_id} with key {idempotency_key}"
        )

        if idempotency_key in MOCK_FISERV_TRANSACTIONS:
            tx = MOCK_FISERV_TRANSACTIONS[idempotency_key]
            return tx["tx_id"]

        if account_id not in MOCK_FISERV_ACCOUNTS:
            raise ValueError(f"Account {account_id} not found in Fiserv")

        account = MOCK_FISERV_ACCOUNTS[account_id]
        account["balance"] += amount

        reversal_tx_id = f"REV-FISERV-{idempotency_key[-12:]}"
        MOCK_FISERV_TRANSACTIONS[idempotency_key] = {
            "status": "SUCCESS",
            "tx_id": reversal_tx_id,
            "amount": amount,
            "account_id": account_id,
            "original_tx_id": original_transaction_id,
        }
        return reversal_tx_id

    def check_debit_status(self, idempotency_key: str) -> dict:
        """Check the status of a debit using the idempotency key."""
        logger.info(f"Fiserv: Checking debit status for key {idempotency_key}")
        if idempotency_key not in MOCK_FISERV_TRANSACTIONS:
            return {"status": "NOT_FOUND"}
        return MOCK_FISERV_TRANSACTIONS[idempotency_key]
