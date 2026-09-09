import uuid
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from server.models import AuditLog, get_utc_now


class AuditService:
    @staticmethod
    def mask_sensitive_data(payload: Any) -> Any:
        if not isinstance(payload, dict):
            return payload

        masked = {}
        for k, v in payload.items():
            k_lower = k.lower()
            if isinstance(v, dict):
                masked[k] = AuditService.mask_sensitive_data(v)
            elif isinstance(v, list):
                masked[k] = [
                    AuditService.mask_sensitive_data(item)
                    if isinstance(item, dict)
                    else item
                    for item in v
                ]
            elif any(
                term in k_lower
                for term in ("card_number", "cardnumber", "pan", "cc_num")
            ):
                s_val = str(v).replace(" ", "").replace("-", "")
                if len(s_val) >= 4:
                    masked[k] = f"**** **** **** {s_val[-4:]}"
                else:
                    masked[k] = "****"
            elif any(
                term in k_lower for term in ("cvv", "cvc", "security_code", "secret")
            ):
                masked[k] = "***"
            elif "password" in k_lower:
                masked[k] = "********"
            else:
                masked[k] = v
        return masked

    @classmethod
    def log_event(
        cls,
        db: Session,
        event_type: str,
        action: Optional[str] = None,
        transaction_id: Optional[str] = None,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
        status_code: Optional[int] = 200,
        signature_valid: Optional[bool] = True,
        raw_payload: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        masked_payload = cls.mask_sensitive_data(raw_payload) if raw_payload else {}
        audit_entry = AuditLog(
            id=f"aud_{uuid.uuid4().hex[:12]}",
            transaction_id=transaction_id,
            event_type=event_type,
            action=action or event_type,
            ip_address=ip_address,
            user_id=user_id,
            status_code=status_code,
            signature_valid=signature_valid,
            masked_payload=masked_payload,
            created_at=get_utc_now(),
        )
        try:
            db.add(audit_entry)
            db.commit()
            db.refresh(audit_entry)
        except Exception:
            db.rollback()
        return audit_entry
