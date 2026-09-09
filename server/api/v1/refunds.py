from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.refund import Refund
from server.schemas.refund import RefundCreate, RefundResponse
from server.services.refund_service import process_refund
from server.dependencies.auth import get_actor_identity

router = APIRouter(prefix="/refunds", tags=["refunds"])


@router.post(
    "",
    response_model=RefundResponse,
    status_code=status.HTTP_200_OK,
    summary="Process Full or Partial Refund",
)
def create_refund(
    payload: RefundCreate,
    request: Request,
    db: Session = Depends(get_db),
    actor_id: str = Depends(get_actor_identity),
):
    client_ip = request.client.host if request.client else None
    refund = process_refund(
        db=db,
        transaction_id=payload.transaction_id,
        amount=payload.amount,
        reason=payload.reason,
        actor_id=actor_id,
        ip_address=client_ip,
    )

    return RefundResponse(
        refund_id=refund.stripe_refund_id,
        transaction_id=refund.transaction_id,
        amount_refunded=refund.amount,
        currency=refund.currency,
        status=refund.status,
        reason=refund.reason,
        created_at=refund.created_at,
    )


@router.get(
    "/{refund_id}",
    response_model=RefundResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Refund Details",
)
def get_refund(refund_id: str, db: Session = Depends(get_db)):
    refund = (
        db.query(Refund)
        .filter((Refund.id == refund_id) | (Refund.stripe_refund_id == refund_id))
        .first()
    )
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")

    return RefundResponse(
        refund_id=refund.stripe_refund_id,
        transaction_id=refund.transaction_id,
        amount_refunded=refund.amount,
        currency=refund.currency,
        status=refund.status,
        reason=refund.reason,
        created_at=refund.created_at,
    )


@router.get(
    "",
    response_model=List[RefundResponse],
    status_code=status.HTTP_200_OK,
    summary="List Refunds",
)
def list_refunds(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    refunds = (
        db.query(Refund)
        .order_by(Refund.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        RefundResponse(
            refund_id=r.stripe_refund_id,
            transaction_id=r.transaction_id,
            amount_refunded=r.amount,
            currency=r.currency,
            status=r.status,
            reason=r.reason,
            created_at=r.created_at,
        )
        for r in refunds
    ]
