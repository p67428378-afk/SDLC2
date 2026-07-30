import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { paymentService } from "../services/paymentService";

export default function PaymentReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mortgageId, sourceId, amount, sourceAccount, mortgageAccount } =
    location.state || {};

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!location.state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm text-center">
          <span className="material-symbols-outlined text-error text-5xl">
            error
          </span>
          <h2 className="mt-4 text-xl font-bold text-on-surface">
            Invalid State
          </h2>
          <p className="mt-2 text-secondary">
            No payment details found to review.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 bg-primary text-on-primary font-label-md py-2 px-4 rounded-xl hover:bg-primary-container transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      // Generate a unique idempotency key
      const idempotencyKey = crypto.randomUUID();
      const payload = {
        source_account_id: sourceId,
        mortgage_account_id: mortgageId,
        amount: parseFloat(amount),
      };

      const receipt = await paymentService.executePayment(
        payload,
        idempotencyKey,
      );

      // Navigate to confirmation page with receipt details
      navigate("/payment-confirmation", {
        state: {
          receipt,
          sourceAccount,
          mortgageAccount,
        },
      });
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        "Failed to execute payment. Please try again.";
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      {/* Page Header */}
      <header className="mb-8">
        <h2 className="font-headline-md text-2xl font-bold text-on-surface">
          Review Mortgage Payment
        </h2>
        <p className="font-body-md text-secondary mt-1">
          Please confirm the payment details before submitting.
        </p>
      </header>

      <div className="max-w-2xl mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary">
            rate_review
          </span>
          <h3 className="font-title-lg text-lg font-semibold">
            Payment Summary
          </h3>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start text-red-800">
            <span className="material-symbols-outlined text-red-600">
              error
            </span>
            <div>
              <p className="font-semibold">Payment Failed</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Source Account */}
          <div className="flex justify-between items-start py-2 border-b border-outline-variant">
            <div>
              <p className="text-xs text-secondary uppercase font-semibold">
                From (Source Account)
              </p>
              <p className="font-body-lg font-semibold text-on-surface mt-1">
                {sourceAccount?.name}
              </p>
              <p className="text-sm text-secondary">
                {sourceAccount?.account_number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary uppercase font-semibold">
                Current Balance
              </p>
              <p className="font-mono-numeric font-semibold text-on-surface mt-1">
                $
                {sourceAccount?.balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Target Mortgage */}
          <div className="flex justify-between items-start py-2 border-b border-outline-variant">
            <div>
              <p className="text-xs text-secondary uppercase font-semibold">
                To (Mortgage Account)
              </p>
              <p className="font-body-lg font-semibold text-on-surface mt-1">
                {mortgageAccount?.name}
              </p>
              <p className="text-sm text-secondary">
                {mortgageAccount?.account_number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary uppercase font-semibold">
                Principal Balance
              </p>
              <p className="font-mono-numeric font-semibold text-on-surface mt-1">
                $
                {mortgageAccount?.principal_balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="flex justify-between items-center py-4 bg-surface-container-low px-4 rounded-xl">
            <div>
              <p className="text-xs text-secondary uppercase font-semibold">
                Payment Amount
              </p>
              <p className="text-xs text-secondary mt-0.5">
                Processed immediately
              </p>
            </div>
            <p className="font-mono-numeric text-2xl font-bold text-primary">
              $
              {parseFloat(amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 h-12 bg-primary text-on-primary font-title-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all duration-100 shadow-md"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Payment...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">lock</span>
                Confirm & Submit Payment
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/make-payment?id=${mortgageId}`)}
            disabled={submitting}
            className="px-6 h-12 bg-white border border-outline-variant text-secondary font-title-lg rounded-lg hover:bg-surface-container transition-all active:scale-95 duration-100"
          >
            Back
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
