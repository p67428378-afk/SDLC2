import React from "react";
import Button from "../common/Button";
import Alert from "../common/Alert";

export default function PaymentReview({
  paymentData,
  selectedAccount,
  validationResult,
  onSubmit,
  onBack,
  isSubmitting,
}) {
  const formattedAmount = paymentData.amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-slate-800">Review Your Payment</h3>

      {validationResult?.isDuplicate && (
        <Alert variant="warning" title="Potential Duplicate Payment">
          {validationResult.warningMessage ||
            "A payment with the same amount and date was recently submitted. Please confirm you want to proceed."}
        </Alert>
      )}

      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
        <div className="flex justify-between p-4 bg-slate-50/50">
          <span className="text-sm text-slate-500">Pay From</span>
          <span className="text-sm font-semibold text-slate-800 text-right">
            {selectedAccount?.accountName} ({selectedAccount?.accountType})
            <br />
            <span className="text-xs text-slate-400 font-normal">
              •••• {selectedAccount?.maskedAccountNumber.slice(-4)}
            </span>
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-sm text-slate-500">Payment Amount</span>
          <span className="text-sm font-bold text-slate-900">
            ${formattedAmount}
          </span>
        </div>
        <div className="flex justify-between p-4 bg-slate-50/50">
          <span className="text-sm text-slate-500">Payment Date</span>
          <span className="text-sm font-semibold text-slate-800">
            {paymentData.paymentDate}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1"
        >
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Processing..." : "Submit Payment"}
        </Button>
      </div>
    </div>
  );
}
