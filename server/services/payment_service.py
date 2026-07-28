import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from server.models import Payment
from server.schemas import PaymentCreateRequest
from server.adapters.fiserv_adapter import FiservAdapter
from server.adapters.cenlar_adapter import CenlarAdapter
from server.services.saga_orchestrator import SagaOrchestrator

logger = logging.getLogger(__name__)


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.fiserv = FiservAdapter()
        self.cenlar = CenlarAdapter()
        self.saga = SagaOrchestrator(db)

    def validate_payment(self, source_account_id: str, amount: float) -> dict:
        """Validate source account status and available balance."""
        logger.info(f"Service: Validating payment of {amount} from {source_account_id}")

        # AC-2.1: Validate account is active and eligible
        self.fiserv.validate_account(source_account_id)

        # AC-2.2: Balance inquiry
        balance = self.fiserv.get_balance(source_account_id)
        sufficient = balance >= amount

        return {"availableBalance": balance, "sufficientFunds": sufficient}

    def create_payment(
        self, customer_id: str, request: PaymentCreateRequest
    ) -> Payment:
        """Create and process a new payment (immediate or scheduled)."""
        logger.info(f"Service: Creating payment for customer {customer_id}")

        # AC-3.6: Enforce payment amount rules
        if request.amount < 1.00 or request.amount > 100000.00:
            raise ValueError("Payment amount must be between $1.00 and $100,000.00")

        # Validate mortgage account exists in Cenlar
        self.cenlar.get_mortgage_details(request.mortgage_account_id)

        # Validate source account and balance
        val_res = self.validate_payment(request.source_account_id, request.amount)
        if not val_res["sufficientFunds"]:
            raise ValueError("Insufficient funds in source account")

        # Generate unique transaction reference
        tx_ref = f"TX-MORT-{uuid.uuid4().hex[:16].upper()}"

        # Create payment record
        payment = Payment(
            customer_id=customer_id,
            source_account_id=request.source_account_id,
            mortgage_account_id=request.mortgage_account_id,
            amount=request.amount,
            status="PENDING",
            payment_type=request.payment_type,
            transaction_reference=tx_ref,
        )

        if request.payment_type == "SCHEDULED":
            if not request.scheduled_date:
                raise ValueError("scheduled_date is required for SCHEDULED payments")
            try:
                # Parse ISO 8601 string
                payment.scheduled_date = datetime.fromisoformat(
                    request.scheduled_date.replace("Z", "+00:00")
                )
            except Exception as e:
                raise ValueError(f"Invalid scheduled_date format: {str(e)}")
            payment.status = "SCHEDULED"
            self.db.add(payment)
            self.db.commit()
            logger.info(
                f"Service: Scheduled payment created for {payment.scheduled_date}"
            )
        else:
            # IMMEDIATE payment
            self.db.add(payment)
            self.db.commit()
            # Execute Saga
            payment = self.saga.execute_payment_saga(payment)

        return payment

    def get_payment_history(self, customer_id: str) -> list:
        """Retrieve payment history for a customer."""
        return (
            self.db.query(Payment)
            .filter(Payment.customer_id == customer_id)
            .order_by(Payment.created_at.desc())
            .all()
        )

    def get_scheduled_payments(self, customer_id: str) -> list:
        """Retrieve pending scheduled payments for a customer."""
        return (
            self.db.query(Payment)
            .filter(Payment.customer_id == customer_id, Payment.status == "SCHEDULED")
            .order_by(Payment.scheduled_date.asc())
            .all()
        )

    def get_payment_detail(self, payment_id: str) -> Payment:
        """Retrieve details of a specific payment."""
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise ValueError("Payment not found")
        return payment

    def get_payment_receipt(self, payment_id: str) -> dict:
        """Generate a receipt for a completed payment."""
        payment = self.get_payment_detail(payment_id)
        if payment.status != "COMPLETED":
            raise ValueError("Receipt is only available for COMPLETED payments")

        return {
            "amount": float(payment.amount),
            "mortgage_account_id": payment.mortgage_account_id,
            "paymentId": payment.id,
            "receiptId": f"REC-{payment.id[-12:].upper()}",
            "source_account_id": payment.source_account_id,
            "status": payment.status,
            "timestamp": payment.updated_at.isoformat(),
            "transaction_reference": payment.transaction_reference,
        }
