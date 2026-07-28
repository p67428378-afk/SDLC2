import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import StepIndicator from "../components/common/StepIndicator";
import PaymentForm from "../components/mortgage/PaymentForm";
import Alert from "../components/common/Alert";
import {
  accountService,
  mortgageService,
  paymentService,
} from "../services/api";

export default function MakePaymentPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [mortgage, setMortgage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [accountsData, mortgageData] = await Promise.all([
          accountService.listAccounts(true),
          mortgageService.getDetails("MTG-88492"),
        ]);
        setAccounts(accountsData);
        setMortgage(mortgageData);
      } catch (err) {
        setError("Failed to load payment details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      setIsValidating(true);
      setError("");

      const validationPayload = {
        amount: formData.amount,
        mortgageId: mortgage.id,
        paymentDate: formData.paymentDate,
        sourceAccountId: formData.sourceAccountId,
      };

      const validationResult =
        await paymentService.validatePayment(validationPayload);

      if (!validationResult.isValid) {
        setError(
          validationResult.warningMessage ||
            "Payment validation failed. Please check your account and balance.",
        );
        return;
      }

      // Navigate to review page with state
      navigate("/payment-review", {
        state: {
          paymentData: formData,
          selectedAccount: accounts.find(
            (acc) => acc.id === formData.sourceAccountId,
          ),
          validationResult,
          mortgage,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "An error occurred during payment validation. Please try again.",
      );
    } finally {
      setIsValidating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Make Payment">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Make Payment">
      <div className="space-y-8">
        <StepIndicator currentStep={1} />

        {error && (
          <div className="max-w-xl mx-auto">
            <Alert variant="danger" title="Validation Error">
              {error}
            </Alert>
          </div>
        )}

        {isValidating && (
          <div className="max-w-xl mx-auto text-center py-4 text-slate-600 font-medium">
            Validating account and balance in real-time via Fiserv...
          </div>
        )}

        <PaymentForm
          accounts={accounts}
          mortgage={mortgage}
          onSubmit={handleFormSubmit}
        />
      </div>
    </AppLayout>
  );
}
