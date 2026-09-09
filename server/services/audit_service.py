import re
from typing import Any, Dict, Union
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from server.models.audit_log import AuditLog

PAN_PATTERN = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
CVV_KEYS = {"cvv", "cvc", "security_code", "card_cvv", "card_cvc"}
PAN_KEYS = {"pan", "card_number", "number", "account_number", "cardnumber"}
SENSITIVE_KEYS = {"password", "secret", "private_key", "client_secret"}


def mask_pan_string(text: str) -> str:
    def _repl(match):
        digits = re.sub(r"\D", "", match.group(0))
        if 13 <= len(digits) <= 19:
            last4 = digits[-4:]
            return f"****-****-****-{last4}"
        return match.group(0)

    return PAN_PATTERN.sub(_repl, text)


def sanitize_data(data: Any) -> Any:
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            k_lower = str(k).lower()
            if any(cvv_key in k_lower for cvv_key in CVV_KEYS):
                sanitized[k] = "***"
            elif any(pan_key in k_lower for pan_key in PAN_KEYS) and isinstance(v, str):
                digits = re.sub(r"\D", "", v)
                if len(digits) >= 4:
                    sanitized[k] = f"****-****-****-{digits[-4:]}"
                else:
                    sanitized[k] = "****"
            elif any(sens_key in k_lower for sens_key in SENSITIVE_KEYS):
                sanitized[k] = "[REDACTED]"
            elif k_lower == "paymentdata" and isinstance(v, str) and len(v) > 20:
                sanitized[k] = f"{v[:6]}...[ENCRYPTED_WALLET_TOKEN]...{v[-4:]}"
            else:
                sanitized[k] = sanitize_data(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, str):
        return mask_pan_string(data)
    else:
        return data


def log_audit_event(
    db: Session,
    action: str,
    actor_id: str,
    payload: Union[Dict[str, Any], Any],
    transaction_id: str = None,
    ip_address: str = None,
) -> AuditLog:
    sanitized_payload = sanitize_data(payload)
    if not isinstance(sanitized_payload, dict):
        sanitized_payload = {"data": sanitized_payload}

    audit_entry = AuditLog(
        transaction_id=transaction_id,
        action=action,
        actor_id=actor_id or "system",
        masked_payload=sanitized_payload,
        ip_address=ip_address,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(audit_entry)
    try:
        db.commit()
        db.refresh(audit_entry)
    except Exception:
        db.rollback()
        raise
    return audit_entry
