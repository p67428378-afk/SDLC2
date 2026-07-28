import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { validateAccountBalance } from "../../services/api";

export default function PaymentForm({
  loanDetails,
  accounts,
  onSubmit,
  onCancel,
}) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [warning, setDuplicateWarning] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validatedAccount, setValidatedAccount] = useState(null);

  // Set default date to today (formatted as YYYY-MM-DD)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  const handleAccountChange = async (e) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
    setError("");
    setValidatedAccount(null);

    if (accountId && amount) {
      await runBalanceValidation(accountId, parseFloat(amount));
    }
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    setError("");
    setValidatedAccount(null);
  };

  const handleAmountBlur = async () => {
    if (selectedAccountId && amount) {
      await runBalanceValidation(selectedAccountId, parseFloat(amount));
    }
  };

  const runBalanceValidation = async (accountId, paymentAmount) => {
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return;
    }

    setIsValidating(true);
    setError("");
    try {
      const result = await validateAccountBalance(accountId, paymentAmount);
      if (!result.sufficientFunds) {
        setError(
          `Insufficient funds. Available balance is ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(result.availableBalance)}.`,
        );
      } else {
        setValidatedAccount({
          accountId,
          availableBalance: result.availableBalance,
        });
      }
    } catch (err) {
      setError("Failed to validate account balance. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDuplicateWarning("");

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount)) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (paymentAmount < loanDetails.minimumPaymentAmount) {
      setError(
        `Payment amount must be at least the minimum payment due of ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(loanDetails.minimumPaymentAmount)}.`,
      );
      return;
    }

    if (paymentAmount > loanDetails.currentBalance) {
      setError(
        `Payment amount cannot exceed the outstanding balance of ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(loanDetails.currentBalance)}.`,
      );
      return;
    }

    if (!selectedAccountId) {
      setError("Please select a funding account.");
      return;
    }

    if (!date) {
      setError("Please select a payment date.");
      return;
    }

    // If not yet validated or account changed, validate now
    if (!validatedAccount || validatedAccount.accountId !== selectedAccountId) {
      setIsValidating(true);
      try {
        const result = await validateAccountBalance(
          selectedAccountId,
          paymentAmount,
        );
        if (!result.sufficientFunds) {
          setError(
            `Insufficient funds. Available balance is ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(result.availableBalance)}.`,
          );
          setIsValidating(false);
          return;
        }
      } catch (err) {
        setError("Failed to validate account balance. Please try again.");
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    // Check for duplicate payment warning (mock check or simple warning)
    // In a real app, we might check scheduled payments, but here we can show a warning if they submit again or just proceed
    onSubmit({
      amount: paymentAmount,
      date,
      fromAccountId: selectedAccountId,
      loanNumber: loanDetails.loanNumber,
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col gap-lg"
    >
      <h2 className="font-headline-md text-headline-md text-on-surface">
        Payment Details
      </h2>

      {error && (
        <div
          role="alert"
          className="p-md bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm flex items-center gap-sm"
        >
          <span className="material-symbols-outlined text-error">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-md">
        {/* Funding Account Selector */}
        <div>
          <label
            htmlFor="funding-account"
            className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs"
          >
            Select Funding Account
          </label>
          <select
            id="funding-account"
            value={selectedAccountId}
            onChange={handleAccountChange}
            className="w-full h-12 px-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
            required
          >
            <option value="">-- Select Account --</option>
            {accounts.map((acc) => (
              <option key={acc.accountId} value={acc.accountId}>
                {acc.accountName} ({acc.accountType}) -{" "}
                {formatCurrency(acc.balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Amount */}
        <div>
          <label
            htmlFor="payment-amount"
            className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs"
          >
            Payment Amount
          </label>
          <div className="relative">
            <span className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">
              $
            </span>
            <input
              id="payment-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              placeholder="0.00"
              className="w-full h-12 pl-lg pr-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-xs">
            Min: {formatCurrency(loanDetails.minimumPaymentAmount)} | Max:{" "}
            {formatCurrency(loanDetails.currentBalance)}
          </p>
        </div>

        {/* Payment Date */}
        <div>
          <label
            htmlFor="payment-date"
            className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs"
          >
            Payment Date
          </label>
          <input
            id="payment-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-12 px-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
            required
          />
          <p className="text-xs text-on-surface-variant mt-xs">
            Payments submitted after 5:00 PM ET will be scheduled for the next
            business day.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-md justify-end mt-md">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 px-xl border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isValidating}
          className="h-12 px-xl bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-[#4338CA] transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-50"
        >
          {isValidating ? "Validating..." : "Review Payment"}
          <span className="material-symbols-outlined text-[20px]">
            arrow_forward
          </span>
        </button>
      </div>
    </form>
  );
}

PaymentForm.propTypes = {
  loanDetails: PropTypes.shape({
    currentBalance: PropTypes.number.isRequired,
    minimumPaymentAmount: PropTypes.number.isRequired,
    loanNumber: PropTypes.string.isRequired,
  }).isRequired,
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      accountId: PropTypes.string.isRequired,
      accountName: PropTypes.string.isRequired,
      accountType: PropTypes.string.isRequired,
      balance: PropTypes.number.isRequired,
    }),
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
