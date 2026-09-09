from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    transaction_id: Optional[str] = None
    action: str
    actor_id: str
    masked_payload: Dict[str, Any]
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
