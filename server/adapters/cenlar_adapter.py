import time


class CenlarTimeoutException(Exception):
    pass


class CenlarValidationException(Exception):
    pass


class CenlarAdapter:
    @staticmethod
    def post_payment(
        loan_id: str, amount: float, source_transaction_id: str, idempotency_key: str
    ) -> str:
        # Simulate network latency
        time.sleep(0.1)

        if loan_id == "timeout-loan" or amount == 3999.00:
            raise CenlarTimeoutException(
                "Cenlar connection timed out during payment posting"
            )
        if amount == 3888.00:
            raise CenlarValidationException(
                "Cenlar payment posting failed: Invalid loan status"
            )

        return f"cenlar-pmt-{idempotency_key[:8]}"

    @staticmethod
    def get_loan_balance(loan_id: str) -> float:
        time.sleep(0.1)
        if loan_id == "timeout-loan":
            raise CenlarTimeoutException(
                "Cenlar connection timed out during loan balance inquiry"
            )
        return 250000.00

    @staticmethod
    def update_payment_history(
        loan_id: str, confirmation_id: str, amount: float
    ) -> bool:
        time.sleep(0.1)
        return True

    @staticmethod
    def get_payment_history(loan_id: str) -> list:
        time.sleep(0.1)
        # Return some mock history
        return [
            {
                "date": "2026-07-01",
                "amount": 1500.00,
                "confirmationNumber": "cenlar-pmt-jul",
                "description": "Mortgage Payment",
                "status": "Posted",
            },
            {
                "date": "2026-06-01",
                "amount": 1500.00,
                "confirmationNumber": "cenlar-pmt-jun",
                "description": "Mortgage Payment",
                "status": "Posted",
            },
            {
                "date": "2026-05-01",
                "amount": 1500.00,
                "confirmationNumber": "cenlar-pmt-may",
                "description": "Mortgage Payment",
                "status": "Posted",
            },
            {
                "date": "2026-04-01",
                "amount": 1500.00,
                "confirmationNumber": "cenlar-pmt-apr",
                "description": "Mortgage Payment",
                "status": "Posted",
            },
        ]
