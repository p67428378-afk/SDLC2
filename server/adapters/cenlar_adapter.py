import logging

logger = logging.getLogger(__name__)

# Mock Cenlar Mortgage Database
MOCK_CENLAR_MORTGAGES = {
    "MORT-9999": {
        "mortgageAccountId": "MORT-9999",
        "outstandingBalance": 245850.00,
        "nextPaymentDueDate": "2026-06-01",
        "minimumPaymentDue": 1250.00,
        "interestRate": 4.25,
        "escrowBalance": 4500.00,
        "loanTerm": "30-Year Fixed",
        "maturityDate": "2050-05-01",
        "history": [
            {
                "date": "2026-05-01",
                "description": "Regular Payment",
                "amount": 1250.00,
                "status": "Completed",
            },
            {
                "date": "2026-04-01",
                "description": "Regular Payment",
                "amount": 1250.00,
                "status": "Completed",
            },
            {
                "date": "2026-03-01",
                "description": "Regular Payment",
                "amount": 1250.00,
                "status": "Completed",
            },
        ],
    },
    "MORT-8888": {
        "mortgageAccountId": "MORT-8888",
        "outstandingBalance": 150000.00,
        "nextPaymentDueDate": "2026-06-01",
        "minimumPaymentDue": 1000.00,
        "interestRate": 3.75,
        "escrowBalance": 3000.00,
        "loanTerm": "15-Year Fixed",
        "maturityDate": "2041-05-01",
        "history": [],
    },
}

# In-memory store for mock transactions to support idempotency and reconciliation
MOCK_CENLAR_TRANSACTIONS = {}


class CenlarAdapter:
    def __init__(self):
        pass

    def get_mortgage_details(self, mortgage_account_id: str) -> dict:
        """Retrieve mortgage details from Cenlar."""
        logger.info(f"Cenlar: Retrieving details for mortgage {mortgage_account_id}")
        if mortgage_account_id not in MOCK_CENLAR_MORTGAGES:
            raise ValueError(
                f"Mortgage account {mortgage_account_id} not found in Cenlar"
            )
        return MOCK_CENLAR_MORTGAGES[mortgage_account_id]

    def post_payment(
        self, mortgage_account_id: str, amount: float, idempotency_key: str
    ) -> str:
        """Post a payment to the mortgage account."""
        logger.info(
            f"Cenlar: Posting payment of {amount} to {mortgage_account_id} with key {idempotency_key}"
        )

        # Idempotency check
        if idempotency_key in MOCK_CENLAR_TRANSACTIONS:
            tx = MOCK_CENLAR_TRANSACTIONS[idempotency_key]
            logger.info(
                f"Cenlar: Duplicate request detected. Returning existing transaction {tx['tx_id']}"
            )
            if tx["status"] == "FAILED":
                raise ValueError(tx["error"])
            return tx["tx_id"]

        if mortgage_account_id not in MOCK_CENLAR_MORTGAGES:
            MOCK_CENLAR_TRANSACTIONS[idempotency_key] = {
                "status": "FAILED",
                "tx_id": None,
                "amount": amount,
                "mortgage_account_id": mortgage_account_id,
                "error": "Mortgage account not found",
            }
            raise ValueError("Mortgage account not found")

        # Simulate failure for MORT-8888
        if mortgage_account_id == "MORT-8888":
            MOCK_CENLAR_TRANSACTIONS[idempotency_key] = {
                "status": "FAILED",
                "tx_id": None,
                "amount": amount,
                "mortgage_account_id": mortgage_account_id,
                "error": "Cenlar posting failed: System error",
            }
            raise ValueError("Cenlar posting failed: System error")

        mortgage = MOCK_CENLAR_MORTGAGES[mortgage_account_id]

        # Update outstanding balance (overpayment is permitted and applied to principal)
        mortgage["outstandingBalance"] = max(
            0.0, mortgage["outstandingBalance"] - amount
        )

        # Add to history
        from datetime import datetime

        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        mortgage["history"].insert(
            0,
            {
                "date": date_str,
                "description": "Mortgage Payment",
                "amount": amount,
                "status": "Completed",
            },
        )

        tx_id = f"TX-CENLAR-{idempotency_key[-12:]}"
        MOCK_CENLAR_TRANSACTIONS[idempotency_key] = {
            "status": "SUCCESS",
            "tx_id": tx_id,
            "amount": amount,
            "mortgage_account_id": mortgage_account_id,
        }
        return tx_id

    def check_posting_status(self, idempotency_key: str) -> dict:
        """Check the status of a posting using the idempotency key."""
        logger.info(f"Cenlar: Checking posting status for key {idempotency_key}")
        if idempotency_key not in MOCK_CENLAR_TRANSACTIONS:
            return {"status": "NOT_FOUND"}
        return MOCK_CENLAR_TRANSACTIONS[idempotency_key]
