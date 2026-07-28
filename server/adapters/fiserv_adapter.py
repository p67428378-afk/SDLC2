import time


class FiservTimeoutException(Exception):
    pass


class FiservValidationException(Exception):
    pass


class FiservAdapter:
    @staticmethod
    def validate_account(account_id: str, customer_id: str) -> bool:
        # Simulate network latency
        time.sleep(0.1)

        if account_id == "invalid-dda" or account_id == "closed-dda":
            return False
        if account_id == "timeout-dda":
            raise FiservTimeoutException(
                "Fiserv connection timed out during account validation"
            )
        return True

    @staticmethod
    def get_balance(account_id: str) -> float:
        time.sleep(0.1)

        if account_id == "timeout-dda":
            raise FiservTimeoutException(
                "Fiserv connection timed out during balance inquiry"
            )
        if account_id == "dda-456":
            return 5430.50
        if account_id == "sav-789":
            return 12500.00
        return 0.0

    @staticmethod
    def transfer_funds(
        idempotency_key: str, from_account_id: str, amount: float
    ) -> str:
        time.sleep(0.1)

        if from_account_id == "timeout-dda" or amount == 4999.00:
            raise FiservTimeoutException(
                "Fiserv connection timed out during funds transfer"
            )
        if amount == 4888.00:
            raise FiservValidationException(
                "Fiserv funds transfer failed: Account restricted"
            )

        # Return a mock transaction ID
        return f"fiserv-tx-{idempotency_key[:8]}"

    @staticmethod
    def reverse_transfer(transaction_id: str, reason: str) -> str:
        time.sleep(0.1)
        return f"fiserv-rev-{transaction_id[-8:]}"

    @staticmethod
    def post_transaction(account_id: str, transaction_id: str, amount: float) -> bool:
        time.sleep(0.1)
        return True
