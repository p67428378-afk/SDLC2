import uuid
from datetime import datetime, date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import Payment, ScheduledPayment, User
from server.services.fiserv import FiservMockService
from server.services.cenlar import CenlarMockService


class PaymentOrchestrationService:
    def __init__(self, fiserv_service: FiservMockService, cenlar_service: CenlarMockService):
        self.fiserv_service = fiserv_service
        self.cenlar_service = cenlar_service

    def get_eligible_sources(self, user: User, mortgage_account_id: str) -> list:
        # Verify mortgage account belongs to user
        if not user.cenlar_customer_id:
            raise HTTPException(status_code=404, detail="Mortgage account not found")
        
        mortgages = self.cenlar_service.get_mortgages(user.cenlar_customer_id)
        mortgage_exists = any(m["id"] == mortgage_account_id for m in mortgages)
        if not mortgage_exists:
            raise HTTPException(status_code=404, detail="Mortgage account not found")

        # Get all accounts for user
        if not user.fiserv_cif:
            return []
        
        accounts = self.fiserv_service.get_accounts(user.fiserv_cif)
        # Filter for DDA and Savings only
        eligible = [
            acc for acc in accounts
            if acc["type"] in ("DDA", "Savings") and acc["status"] == "Active"
        ]
        return eligible

    def execute_payment(
        self, db: Session, user: User, idempotency_key: str,
        source_account_id: str, mortgage_account_id: str, amount: float
    ) -> dict:
        # Check idempotency first
        existing_payment = db.query(Payment).filter(Payment.idempotency_key == idempotency_key).first()
        if existing_payment:
            source_bal = self.fiserv_service.get_available_balance(source_account_id) or 0.0
            mort_details = self.cenlar_service.get_mortgage_details(user.cenlar_customer_id, mortgage_account_id)
            mort_bal = mort_details["principal_balance"] if mort_details else 0.0
            
            return {
                "amount": float(existing_payment.amount),
                "confirmation_number": existing_payment.confirmation_number,
                "mortgage_account_id": existing_payment.mortgage_account_id,
                "payment_date": existing_payment.created_at.isoformat(),
                "source_account_id": existing_payment.source_account_id,
                "updated_mortgage_balance": mort_bal,
                "updated_source_balance": source_bal
            }

        # 1. Validate
        if not user.fiserv_cif:
            raise HTTPException(status_code=400, detail="User has no core banking profile")
        
        accounts = self.fiserv_service.get_accounts(user.fiserv_cif)
        source_acc = next((acc for acc in accounts if acc["id"] == source_account_id), None)
        if not source_acc:
            raise HTTPException(status_code=400, detail="Source account not found or does not belong to user")
        
        if source_acc["type"] not in ("DDA", "Savings") or source_acc["status"] != "Active":
            raise HTTPException(status_code=400, detail="Source account is not eligible for payments")

        if not user.cenlar_customer_id:
            raise HTTPException(status_code=400, detail="User has no mortgage profile")
        
        mortgages = self.cenlar_service.get_mortgages(user.cenlar_customer_id)
        mort_acc = next((m for m in mortgages if m["id"] == mortgage_account_id), None)
        if not mort_acc:
            raise HTTPException(status_code=400, detail="Mortgage account not found or does not belong to user")

        # Validate balance
        available_balance = source_acc["balance"]
        if available_balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient funds in source account")

        # 2. Debit Fiserv
        debit_success = self.fiserv_service.debit_account(source_account_id, amount)
        if not debit_success:
            raise HTTPException(status_code=400, detail="Failed to debit source account")

        # 3. Post to Cenlar
        cenlar_success = False
        try:
            cenlar_success = self.cenlar_service.process_payment(mortgage_account_id, amount)
        except Exception:
            pass

        if not cenlar_success:
            # Compensate: reverse Fiserv debit
            self.fiserv_service.credit_account(source_account_id, amount)
            raise HTTPException(status_code=400, detail="Failed to post payment to mortgage servicer")

        # 4. Persist to Database
        confirmation_number = f"CONF-{uuid.uuid4().hex[:8].upper()}"
        payment = Payment(
            user_id=user.id,
            idempotency_key=idempotency_key,
            source_account_id=source_account_id,
            mortgage_account_id=mortgage_account_id,
            amount=amount,
            status="COMPLETED",
            confirmation_number=confirmation_number
        )
        db.add(payment)
        
        try:
            db.commit()
            db.refresh(payment)
        except Exception as e:
            db.rollback()
            # Compensate: reverse Cenlar post and Fiserv debit
            self.cenlar_service.reverse_payment(mortgage_account_id, amount)
            self.fiserv_service.credit_account(source_account_id, amount)
            raise HTTPException(status_code=500, detail=f"Database persistence failed: {str(e)}")

        # Get updated balances
        updated_source_bal = self.fiserv_service.get_available_balance(source_account_id)
        updated_mort_details = self.cenlar_service.get_mortgage_details(user.cenlar_customer_id, mortgage_account_id)
        updated_mort_bal = updated_mort_details["principal_balance"] if updated_mort_details else 0.0

        return {
            "amount": amount,
            "confirmation_number": confirmation_number,
            "mortgage_account_id": mortgage_account_id,
            "payment_date": payment.created_at.isoformat(),
            "source_account_id": source_account_id,
            "updated_mortgage_balance": updated_mort_bal,
            "updated_source_balance": updated_source_bal
        }

    def schedule_payment(
        self, db: Session, user: User,
        source_account_id: str, mortgage_account_id: str, amount: float, scheduled_date: date
    ) -> ScheduledPayment:
        if not user.fiserv_cif:
            raise HTTPException(status_code=400, detail="User has no core banking profile")
        
        accounts = self.fiserv_service.get_accounts(user.fiserv_cif)
        source_acc = next((acc for acc in accounts if acc["id"] == source_account_id), None)
        if not source_acc:
            raise HTTPException(status_code=400, detail="Source account not found or does not belong to user")
        
        if source_acc["type"] not in ("DDA", "Savings") or source_acc["status"] != "Active":
            raise HTTPException(status_code=400, detail="Source account is not eligible for payments")

        if not user.cenlar_customer_id:
            raise HTTPException(status_code=400, detail="User has no mortgage profile")
        
        mortgages = self.cenlar_service.get_mortgages(user.cenlar_customer_id)
        mort_acc = next((m for m in mortgages if m["id"] == mortgage_account_id), None)
        if not mort_acc:
            raise HTTPException(status_code=400, detail="Mortgage account not found or does not belong to user")

        # Validate date is in the future
        if scheduled_date <= datetime.utcnow().date():
            raise HTTPException(status_code=400, detail="Scheduled date must be in the future")

        scheduled_payment = ScheduledPayment(
            user_id=user.id,
            source_account_id=source_account_id,
            mortgage_account_id=mortgage_account_id,
            amount=amount,
            scheduled_date=scheduled_date,
            status="PENDING"
        )
        db.add(scheduled_payment)
        try:
            db.commit()
            db.refresh(scheduled_payment)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to schedule payment: {str(e)}")

        return scheduled_payment

    def get_scheduled_payments(self, db: Session, user: User) -> list:
        return db.query(ScheduledPayment).filter(
            ScheduledPayment.user_id == user.id,
            ScheduledPayment.status == "PENDING"
        ).all()

    def cancel_scheduled_payment(self, db: Session, user: User, payment_id: str) -> bool:
        payment = db.query(ScheduledPayment).filter(
            ScheduledPayment.id == payment_id,
            ScheduledPayment.user_id == user.id
        ).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Scheduled payment not found")
        
        if payment.status != "PENDING":
            raise HTTPException(status_code=400, detail="Only pending scheduled payments can be cancelled")

        payment.status = "CANCELLED"
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to cancel scheduled payment: {str(e)}")

    def get_payment_history(self, db: Session, user: User) -> list:
        return db.query(Payment).filter(Payment.user_id == user.id).order_by(Payment.created_at.desc()).all()
