import hmac
import hashlib
import time
import uuid
from typing import Dict, Any, Optional


def create_payment_intent(
    amount: float,
    currency: str,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Creates or simulates a Stripe PaymentIntent.
    Stripe expects amount in smallest currency unit (cents).
    """
    pi_id = f"pi_{uuid.uuid4().hex[:24]}"
    client_secret = f"{pi_id}_secret_{uuid.uuid4().hex[:16]}"
    cents = int(round(amount * 100))

    return {
        "id": pi_id,
        "client_secret": client_secret,
        "amount": cents,
        "currency": currency.lower(),
        "status": "requires_payment_method",
        "description": description,
        "metadata": metadata or {},
    }


def create_stripe_refund(
    payment_intent_id: str, amount: float, currency: str, reason: Optional[str] = None
) -> Dict[str, Any]:
    """
    Creates or simulates a Stripe Refund for a PaymentIntent.
    """
    refund_id = f"re_{uuid.uuid4().hex[:24]}"
    cents = int(round(amount * 100))

    return {
        "id": refund_id,
        "payment_intent": payment_intent_id,
        "amount": cents,
        "currency": currency.lower(),
        "status": "succeeded",
        "reason": reason or "requested_by_customer",
    }


def generate_webhook_signature(payload_bytes: bytes, secret: str) -> str:
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
    signature = hmac.new(
        secret.encode("utf-8"), signed_payload, hashlib.sha256
    ).hexdigest()
    return f"t={timestamp},v1={signature}"


def verify_webhook_signature(
    payload_bytes: bytes, sig_header: Optional[str], secret: str, tolerance: int = 300
) -> bool:
    if not sig_header or not secret:
        return False

    try:
        elements = sig_header.split(",")
        timestamp = None
        signatures = []

        for item in elements:
            parts = item.strip().split("=")
            if len(parts) == 2:
                if parts[0] == "t":
                    timestamp = int(parts[1])
                elif parts[0] == "v1":
                    signatures.append(parts[1])

        if timestamp is None or not signatures:
            return False

        # Verify timestamp tolerance if tolerance > 0
        current_time = int(time.time())
        if tolerance > 0 and abs(current_time - timestamp) > tolerance:
            return False

        signed_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
        expected_sig = hmac.new(
            secret.encode("utf-8"), signed_payload, hashlib.sha256
        ).hexdigest()

        return any(hmac.compare_digest(expected_sig, s) for s in signatures)
    except Exception:
        return False
