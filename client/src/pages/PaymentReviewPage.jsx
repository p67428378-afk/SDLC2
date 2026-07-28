import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import StepIndicator from "../components/common/StepIndicator";
import PaymentReview from "../components/mortgage/PaymentReview";
import Alert from "../components/common/Alert";
import { paymentService } from "../services/api";

export default function PaymentReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const state = location.state || {};
  const { paymentData, selectedAccount, validationResult, mortgage } = state;

  useEffect(() => {
    if (!paymentData || !selectedAccount) {
      navigate("/make-payment");
    }
  }, [paymentData, selectedAccount, navigate]);

  if (!paymentData || !selectedAccount) {
    return null;
  }

  const handlePaymentSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      // Generate a unique idempotency key
      const idempotencyKey = crypto.randomUUID();

      const payload = {
        amount: paymentData.amount,
        idempotencyKey,
        mortgageId: mortgage.id,
        paymentDate: paymentData.paymentDate,
        sourceAccountId: paymentData.sourceAccountId,
      };

      const response = await paymentService.submitPayment(payload);

      // Navigate to confirmation page
      navigate("/confirmation", {
        state: {
          paymentResult: response,
          paymentData,
          selectedAccount,
          mortgage,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "An error occurred while processing your payment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Review Payment">
      <div className="space-y-8">
        <StepIndicator currentStep={2} />

        {error && (
          <div className="max-w-xl mx-auto">
            <Alert variant="danger" title="Payment Error">
              {error}
            </Alert>
          </div>
        )}

        <PaymentReview
          paymentData={paymentData}
          selectedAccount={selectedAccount}
          validationResult={validationResult}
          onSubmit={handlePaymentSubmit}
          onBack={() => navigate("/make-payment", { state })}
          isSubmitting={isSubmitting}
        />
      </div>
    </AppLayout>
  );
}
