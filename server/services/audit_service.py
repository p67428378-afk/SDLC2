import re
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from server.models import AuditLog


def mask_sensitive_data(data: Any) -> Any:
    if isinstance(data, dict):
        masked = {}
        for k, v in data.items():
            key_lower = k.lower()
            if any(
                secret_term in key_lower
                for secret_term in ["cvv", "cvc", "security_code", "password", "secret"]
            ):
                masked[k] = "[REDACTED]"
            elif any(
                card_term in key_lower
                for card_term in ["card_number", "pan", "account_number"]
            ) and isinstance(v, str):
                digits = re.sub(r"\D", "", v)
                if len(digits) >= 4:
                    masked[k] = f"**** **** **** {digits[-4:]}"
                else:
                    masked[k] = "****"
            elif "token" in key_lower and isinstance(v, str) and len(v) > 8:
                masked[k] = f"{v[:4]}...{v[-4:]}"
            else:
                masked[k] = mask_sensitive_data(v)
        return masked
    elif isinstance(data, list):
        return [mask_sensitive_data(item) for item in data]
    elif isinstance(data, str):
        # Look for 13-19 digit card numbers in plain text
        def mask_card_match(match):
            val = match.group(0)
            digits = re.sub(r"\D", "", val)
            return f"**** **** **** {digits[-4:]}"

        return re.sub(r"\b(?:\d[ -]*?){13,19}\b", mask_card_match, data)
    return data


def log_audit_event(
    db: Session,
    event_type: str,
    transaction_id: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    masked = mask_sensitive_data(payload) if payload else {}
    audit_entry = AuditLog(
        transaction_id=transaction_id,
        event_type=event_type,
        masked_payload=masked,
        ip_address=ip_address or "127.0.0.1",
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
