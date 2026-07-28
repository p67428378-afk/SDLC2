import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from server.models import Payment, PaymentAuditLog
from server.adapters.fiserv_adapter import FiservAdapter
from server.adapters.cenlar_adapter import CenlarAdapter
from server.services.saga_orchestrator import SagaOrchestrator

logger = logging.getLogger(__name__)


def recover_stuck_sagas(db: Session, timeout_minutes: int = 15):
    """Query and recover payments stuck in PROCESSING state."""
    logger.info("Worker: Running saga recovery...")
    cutoff = datetime.utcnow() - timedelta(minutes=timeout_minutes)

    stuck_payments = (
        db.query(Payment)
        .filter(Payment.status == "PROCESSING", Payment.updated_at <= cutoff)
        .all()
    )

    logger.info(f"Worker: Found {len(stuck_payments)} stuck payments")

    fiserv = FiservAdapter()
    cenlar = CenlarAdapter()
    saga = SagaOrchestrator(db)

    for payment in stuck_payments:
        logger.info(f"Worker: Recovering payment {payment.id}")

        debit_key = f"{payment.transaction_reference}:debit"
        post_key = f"{payment.transaction_reference}:post"

        # Check Fiserv debit status
        debit_status = fiserv.check_debit_status(debit_key)

        if debit_status.get("status") == "SUCCESS":
            # Debit succeeded. Now check Cenlar posting status.
            payment.fiserv_transaction_id = debit_status.get("tx_id")
            posting_status = cenlar.check_posting_status(post_key)

            if posting_status.get("status") == "SUCCESS":
                # Posting also succeeded! Complete the payment.
                payment.cenlar_transaction_id = posting_status.get("tx_id")
                payment.status = "COMPLETED"

                audit_log = PaymentAuditLog(
                    payment_id=payment.id,
                    step_name="RECOVERY_COMPLETE_SUCCESS",
                    status="SUCCESS",
                    response_payload={
                        "message": "Saga recovered and completed successfully"
                    },
                )
                db.add(audit_log)
                logger.info(
                    f"Worker: Payment {payment.id} recovered and marked COMPLETED"
                )
            elif posting_status.get("status") == "FAILED":
                # Posting failed. Trigger compensating reversal.
                logger.warning(
                    f"Worker: Posting failed for {payment.id}. Reversing debit."
                )
                try:
                    saga._reverse_debit_step(payment)
                    logger.info(f"Worker: Payment {payment.id} reversed successfully")
                except Exception as e:
                    logger.critical(
                        f"Worker: Reversal failed during recovery for {payment.id}: {str(e)}"
                    )
                    payment.status = "REVERSAL_FAILED"
            else:
                # Posting status is unknown or not found. Try to post again or reverse.
                # To be safe, let's try to post again (since Cenlar is idempotent).
                logger.info("Worker: Posting status unknown. Retrying Cenlar posting.")
                try:
                    saga._post_cenlar_step(payment)
                    logger.info(f"Worker: Payment {payment.id} completed after retry")
                except Exception:
                    logger.warning("Worker: Retry posting failed. Reversing debit.")
                    try:
                        saga._reverse_debit_step(payment)
                    except Exception as rev_err:
                        logger.critical(f"Worker: Reversal failed: {str(rev_err)}")
                        payment.status = "REVERSAL_FAILED"
        elif debit_status.get("status") == "FAILED":
            # Debit failed. Mark payment as failed.
            payment.status = "FAILED"
            audit_log = PaymentAuditLog(
                payment_id=payment.id,
                step_name="RECOVERY_COMPLETE_FAILURE",
                status="SUCCESS",
                response_payload={
                    "message": "Saga recovered and marked FAILED because debit failed"
                },
            )
            db.add(audit_log)
            logger.info(f"Worker: Payment {payment.id} recovered and marked FAILED")
        else:
            # Debit status is unknown or not found. This means the debit never reached Fiserv.
            # We can safely mark the payment as FAILED.
            payment.status = "FAILED"
            audit_log = PaymentAuditLog(
                payment_id=payment.id,
                step_name="RECOVERY_COMPLETE_FAILURE",
                status="SUCCESS",
                response_payload={
                    "message": "Saga recovered and marked FAILED because debit never executed"
                },
            )
            db.add(audit_log)
            logger.info(
                f"Worker: Payment {payment.id} recovered and marked FAILED (no debit found)"
            )

    db.commit()
