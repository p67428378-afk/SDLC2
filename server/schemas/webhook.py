from pydantic import BaseModel
from typing import Optional


class WebhookResponse(BaseModel):
    received: bool
    event_id: str
    status: str
    detail: Optional[str] = None
