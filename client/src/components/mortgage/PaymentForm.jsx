import React, { useState } from "react";
import Button from "../common/Button";
import Alert from "../common/Alert";

export default function PaymentForm({
  accounts,
  mortgage,
  onSubmit,
  initialData = {},
}) {
  const [sourceAccountId, setSourceAccountId] = useState(
    initialData.sourceAccountId || "",
  );
  const [amount, setAmount] = useState(
    initialData.amount || mortgage?.minimumPaymentDue || "",
  );
  const [paymentDate, setPaymentDate] = useState(
    initialData.paymentDate || new Date().toISOString().split("T")[0],
  );
  const [error, setError] = useState("");

  const selectedAccount = accounts.find((acc) => acc.id === sourceAccountId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!sourceAccountId) {
      setError("Please select a source account.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (
      selectedAccount &&
      parseFloat(amount) > selectedAccount.availableBalance
    ) {
      setError(
        `Insufficient funds. Selected account has an available balance of $${selectedAccount.availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
      );
      return;
    }

    if (!paymentDate) {
      setError("Please select a payment date.");
      return;
    }

    onSubmit({
      sourceAccountId,
      amount: parseFloat(amount),
      paymentDate,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm"
    >
      <h3 className="text-lg font-bold text-slate-800 mb-4">Payment Details</h3>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Source Account Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Pay From (Source Account)
        </label>
        <select
          value={sourceAccountId}
          onChange={(e) => setSourceAccountId(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        >
          <option value="">Select an account</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.accountName} ({acc.accountType}) - ••••{" "}
              {acc.maskedAccountNumber.slice(-4)} [Balance: $
              {acc.availableBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
              ]
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400">
          Note: Payments can be made from checking (DDA) or savings accounts.
        </p>
      </div>

      {/* Payment Amount */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Payment Amount ($)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        {mortgage && (
          <button
            type="button"
            onClick={() => setAmount(mortgage.minimumPaymentDue)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Use Minimum Payment Due: $
            {mortgage.minimumPaymentDue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </button>
        )}
      </div>

      {/* Payment Date */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Payment Date
        </label>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      <Button type="submit" className="w-full">
        Continue to Review
      </Button>
    </form>
  );
}
