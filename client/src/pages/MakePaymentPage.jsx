import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mortgageService } from "../services/api";
import PaymentForm from "../components/mortgage/PaymentForm";
import PaymentBreakdownCard from "../components/mortgage/PaymentBreakdownCard";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function MakePaymentPage({ onSetPaymentData }) {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState(1250.0);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const data = await mortgageService.getEligibleAccounts();
        setAccounts(data);
      } catch (err) {
        setError("Failed to load eligible source accounts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const handleSubmit = (formData) => {
    onSetPaymentData(formData);
    navigate("/review");
  };

  return (
    <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex items-center gap-sm mb-sm">
        <button
          onClick={() => navigate("/")}
          className="p-xs hover:bg-surface-container rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-on-surface-variant" />
        </button>
        <div>
          <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface font-bold">
            Make Mortgage Payment
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Select a source account and enter payment details.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-xl flex justify-center items-center gap-sm">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-on-surface-variant">
            Loading eligible accounts...
          </span>
        </div>
      ) : error ? (
        <div className="p-xl text-center text-error flex flex-col items-center gap-sm bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <AlertCircle className="w-10 h-10" />
          <span className="font-medium">{error}</span>
          <button
            onClick={() => navigate("/")}
            className="mt-md h-10 px-md bg-primary-container text-on-primary rounded font-label-md text-label-md hover:bg-[#4338CA] transition-colors"
          >
            Back to Details
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
          <div className="lg:col-span-2">
            <PaymentForm
              accounts={accounts}
              onSubmit={handleSubmit}
              initialData={{ amount: estimatedAmount }}
            />
          </div>
          <div className="lg:col-span-1">
            <PaymentBreakdownCard amount={estimatedAmount} />
          </div>
        </div>
      )}
    </div>
  );
}
