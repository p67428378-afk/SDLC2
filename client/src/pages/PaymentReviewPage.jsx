import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getFundingAccounts, submitPayment } from "../services/api";
import PaymentReviewCard from "../components/mortgage/PaymentReviewCard";

export default function PaymentReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const paymentData = location.state?.paymentData;

  useEffect(() => {
    if (!paymentData) {
      navigate("/");
      return;
    }

    const fetchAccounts = async () => {
      try {
        const data = await getFundingAccounts();
        setAccounts(data);
      } catch (err) {
        setError("Failed to load account details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [paymentData, navigate]);

  const handleConfirm = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const result = await submitPayment(paymentData);
      navigate("/payment-confirmation", { state: { result } });
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        "Failed to process payment. Please try again.";
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedAccount = accounts.find(
    (acc) => acc.accountId === paymentData?.fromAccountId,
  );

  return (
    <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <div className="flex flex-col gap-xs mb-sm">
        <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface">
          Review Payment
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Double-check your payment details before submitting.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-md bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm flex items-center gap-sm"
        >
          <span className="material-symbols-outlined text-error">error</span>
          <span>{error}</span>
        </div>
      )}

      {paymentData && (
        <PaymentReviewCard
          paymentData={paymentData}
          account={selectedAccount}
          onConfirm={handleConfirm}
          onEdit={() => navigate("/make-payment")}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
