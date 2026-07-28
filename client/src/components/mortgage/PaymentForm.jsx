import React, { useState, useEffect } from "react";
import { mortgageService } from "../../services/api";
import { AlertCircle, Loader2 } from "lucide-react";

export default function PaymentForm({ accounts, onSubmit, initialData = {} }) {
  const [sourceAccountId, setSourceAccountId] = useState(
    initialData.source_account_id || "",
  );
  const [amount, setAmount] = useState(initialData.amount || "");
  const [paymentType, setPaymentType] = useState(
    initialData.payment_type || "IMMEDIATE",
  );
  const [scheduledDate, setScheduledDate] = useState(
    initialData.scheduled_date || "",
  );

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Reset validation state when inputs change
  useEffect(() => {
    setValidationError("");
    setValidationSuccess(false);
  }, [sourceAccountId, amount, paymentType, scheduledDate]);

  const handleReview = async (e) => {
    e.preventDefault();
    setValidationError("");
    setValidationSuccess(false);

    if (!sourceAccountId) {
      setValidationError("Please select a source account.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1.0 || parsedAmount > 100000.0) {
      setValidationError(
        "Payment amount must be between $1.00 and $100,000.00.",
      );
      return;
    }

    if (paymentType === "SCHEDULED" && !scheduledDate) {
      setValidationError("Please select a scheduled date.");
      return;
    }

    if (paymentType === "SCHEDULED") {
      const selectedDate = new Date(scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        setValidationError("Scheduled date must be in the future.");
        return;
      }
    }

    setIsValidating(true);
    try {
      const res = await mortgageService.validatePayment(
        sourceAccountId,
        parsedAmount,
      );
      if (!res.sufficientFunds) {
        setValidationError(
          `Insufficient funds. Available balance is $${res.availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
        );
        setIsValidating(false);
        return;
      }

      setValidationSuccess(true);
      onSubmit({
        source_account_id: sourceAccountId,
        amount: parsedAmount,
        payment_type: paymentType,
        scheduled_date: paymentType === "SCHEDULED" ? scheduledDate : null,
        availableBalance: res.availableBalance,
      });
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        "Failed to validate account balance. Please try again.";
      setValidationError(errMsg);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <form
      onSubmit={handleReview}
      noValidate
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col gap-lg"
    >
      <h2 className="font-headline-md text-headline-md text-on-surface">
        Payment Details
      </h2>

      {validationError && (
        <div className="p-md bg-error-container text-on-error-container rounded-lg flex items-start gap-sm border border-error/20">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-error" />
          <div className="font-body-sm text-body-sm">{validationError}</div>
        </div>
      )}

      {/* Source Account */}
      <div className="flex flex-col gap-xs">
        <label
          htmlFor="sourceAccount"
          className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
        >
          Pay From (Source Account)
        </label>
        <select
          id="sourceAccount"
          value={sourceAccountId}
          onChange={(e) => setSourceAccountId(e.target.value)}
          className="h-12 px-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          required
        >
          <option value="">Select an eligible account</option>
          {accounts.map((acc) => (
            <option key={acc.accountId} value={acc.accountId}>
              {acc.accountName} ({acc.accountType}) - ****
              {acc.accountId.slice(-4)} [Balance: $
              {acc.balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
              ]
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-xs">
        <label
          htmlFor="amount"
          className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
        >
          Payment Amount
        </label>
        <div className="relative">
          <span className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">
            $
          </span>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="1.00"
            max="100000.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full h-12 pl-8 pr-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
            required
          />
        </div>
        <p className="text-xs text-on-surface-variant">
          Min: $1.00 | Max: $100,000.00
        </p>
      </div>

      {/* Payment Type */}
      <div className="flex flex-col gap-xs">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          Payment Schedule
        </span>
        <div className="grid grid-cols-2 gap-md">
          <button
            type="button"
            onClick={() => setPaymentType("IMMEDIATE")}
            className={`h-12 rounded-lg border font-medium flex items-center justify-center transition-all ${
              paymentType === "IMMEDIATE"
                ? "border-primary bg-surface-container-high text-primary"
                : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            Immediate
          </button>
          <button
            type="button"
            onClick={() => setPaymentType("SCHEDULED")}
            className={`h-12 rounded-lg border font-medium flex items-center justify-center transition-all ${
              paymentType === "SCHEDULED"
                ? "border-primary bg-surface-container-high text-primary"
                : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            Scheduled
          </button>
        </div>
      </div>

      {/* Scheduled Date */}
      {paymentType === "SCHEDULED" && (
        <div className="flex flex-col gap-xs animate-fadeIn">
          <label
            htmlFor="scheduledDate"
            className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
          >
            Scheduled Date
          </label>
          <input
            id="scheduledDate"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="h-12 px-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            required
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isValidating}
        className="w-full h-12 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm hover:bg-[#4338CA] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isValidating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Validating Funds...
          </>
        ) : (
          "Review Payment"
        )}
      </button>
    </form>
  );
}
