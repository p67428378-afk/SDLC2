import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mortgageService } from "../services/api";
import PaymentReviewCard from "../components/mortgage/PaymentReviewCard";

export default function PaymentReviewPage({ paymentData, onSetReceipt }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!paymentData) {
    // Redirect back if no payment data is present
    React.useEffect(() => {
      navigate("/pay");
    }, [navigate]);
    return null;
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        amount: paymentData.amount,
        mortgage_account_id: "30049182", // Hardcoded for this loan
        payment_type: paymentData.payment_type,
        scheduled_date: paymentData.scheduled_date,
        source_account_id: paymentData.source_account_id,
      };

      const res = await mortgageService.createPayment(payload);

      // Fetch receipt details if immediate, or construct a mock receipt for scheduled
      if (paymentData.payment_type === "IMMEDIATE") {
        try {
          const receipt = await mortgageService.getPaymentReceipt(
            res.paymentId,
          );
          onSetReceipt(receipt);
        } catch (receiptErr) {
          // Fallback to constructing receipt from response if receipt endpoint fails
          onSetReceipt({
            amount: paymentData.amount,
            mortgage_account_id: "30049182",
            paymentId: res.paymentId,
            receiptId: `REC-${res.paymentId.slice(0, 8).toUpperCase()}`,
            source_account_id: paymentData.source_account_id,
            status: res.status,
            timestamp: res.timestamp,
            transaction_reference:
              res.cenlarConfirmationId || res.transactionId || "N/A",
          });
        }
      } else {
        // For scheduled payments, construct a confirmation receipt
        onSetReceipt({
          amount: paymentData.amount,
          mortgage_account_id: "30049182",
          paymentId: res.paymentId,
          receiptId: `SCH-${res.paymentId.slice(0, 8).toUpperCase()}`,
          source_account_id: paymentData.source_account_id,
          status: res.status,
          timestamp: res.timestamp,
          transaction_reference: "SCHEDULED",
        });
      }

      navigate("/confirmation");
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        "Payment processing failed. Please try again.";
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <PaymentReviewCard
        data={paymentData}
        mortgageAccount="30049182"
        onConfirm={handleConfirm}
        onBack={() => navigate("/pay")}
        isSubmitting={isSubmitting}
        error={error}
      />
    </div>
  );
}
