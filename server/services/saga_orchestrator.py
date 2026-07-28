import logging
from sqlalchemy.orm import Session
from server.models import Payment, PaymentAuditLog
from server.adapters.fiserv_adapter import FiservAdapter
from server.adapters.cenlar_adapter import CenlarAdapter

logger = logging.getLogger(__name__)


class SagaOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.fiserv = FiservAdapter()
        self.cenlar = CenlarAdapter()

    def execute_payment_saga(self, payment: Payment) -> Payment:
        """Execute the payment saga synchronously."""
        logger.info(f"Saga: Starting payment saga for payment {payment.id}")

        # Step 1: Debit Fiserv
        try:
            self._debit_fiserv_step(payment)
        except Exception as e:
            logger.error(f"Saga: Step 1 (Debit Fiserv) failed: {str(e)}")
            # If it's a validation or insufficient funds error, payment is already marked FAILED.
            # If it's a timeout/unknown state, it might be in PROCESSING for recovery.
            self.db.commit()
            raise e

        # Step 2: Post Cenlar
        try:
            self._post_cenlar_step(payment)
        except Exception as e:
            logger.error(
                f"Saga: Step 2 (Post Cenlar) failed: {str(e)}. Initiating compensating reversal."
            )
            # Step 3: Compensating Reversal
            try:
                self._reverse_debit_step(payment)
            except Exception as rev_err:
                logger.critical(f"Saga: Compensating reversal failed! {str(rev_err)}")
                payment.status = "REVERSAL_FAILED"
                self.db.commit()
                raise RuntimeError(
                    f"Payment failed and compensating reversal failed: {str(rev_err)}"
                ) from rev_err

            self.db.commit()
            raise ValueError(
                f"Payment posting failed. Funds have been reversed. Error: {str(e)}"
            )

        self.db.commit()
        return payment

    def _debit_fiserv_step(self, payment: Payment):
        debit_key = f"{payment.transaction_reference}:debit"

        # Create audit log
        audit_log = PaymentAuditLog(
            payment_id=payment.id,
            step_name="DEBIT_FISERV",
            status="IN_PROGRESS",
            request_payload={
                "account_id": payment.source_account_id,
                "amount": float(payment.amount),
                "idempotency_key": debit_key,
            },
        )
        self.db.add(audit_log)
        payment.status = "PROCESSING"
        self.db.commit()

        try:
            # Call Fiserv
            tx_id = self.fiserv.debit_account(
                payment.source_account_id, float(payment.amount), debit_key
            )

            # Update payment and audit log
            payment.fiserv_transaction_id = tx_id
            audit_log.status = "SUCCESS"
            audit_log.response_payload = {"transaction_id": tx_id}
            self.db.commit()
            logger.info(f"Saga: Fiserv debit succeeded. Tx ID: {tx_id}")

        except TimeoutError as te:
            # Handle timeout / unknown state (AC-3.5)
            logger.warning(
                "Saga: Fiserv debit timed out. Performing reconciliation check."
            )
            audit_log.status = "FAILURE"
            audit_log.error_message = f"Timeout: {str(te)}"
            self.db.commit()

            # Reconcile immediately
            recon = self.fiserv.check_debit_status(debit_key)
            if recon.get("status") == "SUCCESS":
                tx_id = recon.get("tx_id")
                payment.fiserv_transaction_id = tx_id
                # Create a new audit log for successful reconciliation
                recon_log = PaymentAuditLog(
                    payment_id=payment.id,
                    step_name="DEBIT_FISERV_RECONCILIATION",
                    status="SUCCESS",
                    response_payload={
                        "transaction_id": tx_id,
                        "message": "Reconciliation confirmed success",
                    },
                )
                self.db.add(recon_log)
                self.db.commit()
                logger.info(
                    f"Saga: Reconciliation confirmed debit success. Tx ID: {tx_id}"
                )
            elif recon.get("status") == "FAILED":
                payment.status = "FAILED"
                self.db.commit()
                raise ValueError(f"Fiserv debit failed: {recon.get('error')}")
            else:
                # Still unknown state. Keep in PROCESSING so recovery worker can handle it.
                logger.error(
                    "Saga: Debit status still UNKNOWN. Leaving in PROCESSING state."
                )
                raise te
        except Exception as e:
            payment.status = "FAILED"
            audit_log.status = "FAILURE"
            audit_log.error_message = str(e)
            self.db.commit()
            raise e

    def _post_cenlar_step(self, payment: Payment):
        post_key = f"{payment.transaction_reference}:post"

        # Create audit log
        audit_log = PaymentAuditLog(
            payment_id=payment.id,
            step_name="POST_CENLAR",
            status="IN_PROGRESS",
            request_payload={
                "mortgage_account_id": payment.mortgage_account_id,
                "amount": float(payment.amount),
                "idempotency_key": post_key,
            },
        )
        self.db.add(audit_log)
        self.db.commit()

        try:
            # Call Cenlar
            tx_id = self.cenlar.post_payment(
                payment.mortgage_account_id, float(payment.amount), post_key
            )

            # Update payment and audit log
            payment.cenlar_transaction_id = tx_id
            payment.status = "COMPLETED"
            audit_log.status = "SUCCESS"
            audit_log.response_payload = {"transaction_id": tx_id}
            self.db.commit()
            logger.info(f"Saga: Cenlar posting succeeded. Tx ID: {tx_id}")

        except Exception as e:
            audit_log.status = "FAILURE"
            audit_log.error_message = str(e)
            self.db.commit()
            raise e

    def _reverse_debit_step(self, payment: Payment):
        reverse_key = f"{payment.transaction_reference}:reverse"

        # Create audit log
        audit_log = PaymentAuditLog(
            payment_id=payment.id,
            step_name="REVERSE_DEBIT",
            status="IN_PROGRESS",
            request_payload={
                "account_id": payment.source_account_id,
                "amount": float(payment.amount),
                "original_transaction_id": payment.fiserv_transaction_id,
                "idempotency_key": reverse_key,
            },
        )
        self.db.add(audit_log)
        self.db.commit()

        try:
            # Call Fiserv to reverse
            tx_id = self.fiserv.reverse_debit(
                payment.source_account_id,
                float(payment.amount),
                payment.fiserv_transaction_id,
                reverse_key,
            )

            # Update payment and audit log
            payment.reversal_transaction_id = tx_id
            payment.status = "REVERSED"
            audit_log.status = "SUCCESS"
            audit_log.response_payload = {"transaction_id": tx_id}
            self.db.commit()
            logger.info(f"Saga: Compensating reversal succeeded. Tx ID: {tx_id}")

        except Exception as e:
            audit_log.status = "FAILURE"
            audit_log.error_message = str(e)
            self.db.commit()
            raise e
