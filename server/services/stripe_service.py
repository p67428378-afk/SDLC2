import hmac
import hashlib
import time
import uuid
from typing import Dict, Any


def generate_stripe_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:24]}"


def create_payment_intent(
    amount: float, currency: str, customer_email: str
) -> Dict[str, Any]:
    payment_intent_id = generate_stripe_id("pi")
    client_secret = f"{payment_intent_id}_secret_{uuid.uuid4().hex[:16]}"
    return {
        "id": payment_intent_id,
        "client_secret": client_secret,
        "amount": int(round(amount * 100)),
        "currency": currency.lower(),
        "status": "requires_payment_method",
        "customer_email": customer_email,
    }


def process_stripe_refund(
    payment_intent_id: str, amount: float, reason: str
) -> Dict[str, Any]:
    refund_id = generate_stripe_id("re")
    return {
        "id": refund_id,
        "payment_intent": payment_intent_id,
        "amount": int(round(amount * 100)),
        "status": "succeeded",
        "reason": reason,
    }


def compute_webhook_signature(payload: bytes, secret: str, timestamp: int) -> str:
    signed_payload = f"{timestamp}.".encode("utf-8") + payload
    mac = hmac.new(secret.encode("utf-8"), msg=signed_payload, digestmod=hashlib.sha256)
    return f"t={timestamp},v1={mac.hexdigest()}"


def verify_webhook_signature(payload: bytes, sig_header: str, secret: str) -> bool:
    if not sig_header or not secret:
        return False
    try:
        elements = dict(item.strip().split("=", 1) for item in sig_header.split(","))
        timestamp = int(elements.get("t", 0))
        received_signature = elements.get("v1", "")
        if not received_signature or not timestamp:
            return False

        # Check tolerance (allow within 10 minutes)
        current_time = int(time.time())
        if abs(current_time - timestamp) > 600:
            return False

        signed_payload = f"{timestamp}.".encode("utf-8") + payload
        expected_mac = hmac.new(
            secret.encode("utf-8"), msg=signed_payload, digestmod=hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_mac, received_signature)
    except Exception:
        return False
