import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMortgageDetails, getFundingAccounts } from "../services/api";
import PaymentForm from "../components/mortgage/PaymentForm";

export default function MakePaymentPage() {
  const [loanDetails, setLoanDetails] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detailsData, accountsData] = await Promise.all([
          getMortgageDetails(),
          getFundingAccounts(),
        ]);
        setLoanDetails(detailsData);
        setAccounts(accountsData);
      } catch (err) {
        setError("Failed to load payment data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = (paymentData) => {
    navigate("/payment-review", { state: { paymentData } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-lg max-w-container-max mx-auto w-full">
        <div
          role="alert"
          className="p-md bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm flex items-center gap-sm"
        >
          <span className="material-symbols-outlined text-error">error</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <div className="flex flex-col gap-xs mb-sm">
        <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface">
          Make Mortgage Payment
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Set up a one-time payment from your eligible deposit or savings
          account.
        </p>
      </div>

      <PaymentForm
        loanDetails={loanDetails}
        accounts={accounts}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/")}
      />
    </div>
  );
}
