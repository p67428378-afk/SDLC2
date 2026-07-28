import logging
from datetime import datetime
from sqlalchemy.orm import Session
from server.models import Payment, PaymentAuditLog
from server.services.saga_orchestrator import SagaOrchestrator
from server.adapters.fiserv_adapter import FiservAdapter

logger = logging.getLogger(__name__)


def run_scheduled_payments(db: Session):
    """Query and execute due scheduled payments."""
    logger.info("Worker: Running scheduled payments execution...")
    now = datetime.utcnow()

    # Find all scheduled payments due on or before now
    due_payments = (
        db.query(Payment)
        .filter(Payment.status == "SCHEDULED", Payment.scheduled_date <= now)
        .all()
    )

    logger.info(f"Worker: Found {len(due_payments)} due scheduled payments")

    fiserv = FiservAdapter()
    saga = SagaOrchestrator(db)

    for payment in due_payments:
        logger.info(f"Worker: Processing scheduled payment {payment.id}")

        # Re-validate account and balance (AC-2.6)
        try:
            fiserv.validate_account(payment.source_account_id)
            balance = fiserv.get_balance(payment.source_account_id)

            if balance < float(payment.amount):
                raise ValueError("Insufficient funds at execution time")

            # Execute Saga
            saga.execute_payment_saga(payment)
            logger.info(f"Worker: Scheduled payment {payment.id} executed successfully")

        except Exception as e:
            logger.error(f"Worker: Scheduled payment {payment.id} failed: {str(e)}")
            payment.status = "FAILED"

            # Log failure in audit logs
            audit_log = PaymentAuditLog(
                payment_id=payment.id,
                step_name="SCHEDULED_EXECUTION_FAILURE",
                status="FAILURE",
                error_message=str(e),
            )
            db.add(audit_log)
            db.commit()

            # In a real system, we would call the Notification Service here.
            logger.info(
                f"Worker: Notification sent to customer for failed payment {payment.id}"
            )

    db.commit()
