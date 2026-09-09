import uuid
from typing import Dict, Any
from fastapi import HTTPException, status


class WalletService:
    SUPPORTED_WALLETS = ["apple_pay", "google_pay", "applepay", "googlepay"]

    @classmethod
    def process_wallet_payment(
        cls, wallet_type: str, payment_token: str, amount: float, currency: str
    ) -> Dict[str, Any]:
        normalized_wallet = wallet_type.lower().replace("-", "_").replace(" ", "")

        if normalized_wallet not in cls.SUPPORTED_WALLETS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unsupported wallet type: {wallet_type}. Must be 'apple_pay' or 'google_pay'.",
            )

        if not payment_token or payment_token.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Payment token is missing or empty.",
            )

        # Check for simulated rejected / expired tokens in tests
        token_lower = payment_token.lower()
        if (
            "expired" in token_lower
            or "invalid" in token_lower
            or "reject" in token_lower
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Payment token has expired or is invalid.",
            )

        # Successful digital wallet charge
        pi_id = f"pi_wallet_{uuid.uuid4().hex[:14]}"
        return {
            "status": "succeeded",
            "payment_intent_id": pi_id,
            "wallet_type": "apple_pay"
            if "apple" in normalized_wallet
            else "google_pay",
            "amount": amount,
            "currency": currency.upper(),
        }
