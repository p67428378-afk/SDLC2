import React from "react";
import PropTypes from "prop-types";

export default function PaymentReviewCard({
  paymentData,
  account,
  onConfirm,
  onEdit,
  isSubmitting,
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col gap-lg">
      <h2 className="font-headline-md text-headline-md text-on-surface">
        Review Your Payment
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Please review the payment details below before confirming.
      </p>

      <div className="border border-outline-variant rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-outline-variant">
          <div className="p-md bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Payment Source
          </div>
          <div className="p-md font-body-md text-body-md text-on-surface">
            {account
              ? `${account.accountName} (${account.accountType})`
              : paymentData.fromAccountId}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-outline-variant">
          <div className="p-md bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Payment Amount
          </div>
          <div className="p-md font-headline-md text-headline-md text-on-surface font-bold">
            {formatCurrency(paymentData.amount)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-outline-variant">
          <div className="p-md bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Payment Date
          </div>
          <div className="p-md font-body-md text-body-md text-on-surface">
            {paymentData.date}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-md bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Mortgage Loan Number
          </div>
          <div className="p-md font-body-md text-body-md text-on-surface">
            {paymentData.loanNumber}
          </div>
        </div>
      </div>

      <div className="p-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface-variant flex items-start gap-sm">
        <span className="material-symbols-outlined text-primary">info</span>
        <div>
          <p className="font-medium text-on-surface mb-xs">
            Regulation E Disclosure
          </p>
          <p>
            By clicking "Confirm &amp; Submit", you authorize Nexus Bank to
            electronically debit your selected account for the amount specified
            on the selected date.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-md justify-end mt-md">
        <button
          type="button"
          onClick={onEdit}
          disabled={isSubmitting}
          className="h-12 px-xl border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          Edit Payment
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="h-12 px-xl bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-[#4338CA] transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Confirm & Submit"}
          <span className="material-symbols-outlined text-[20px]">
            check_circle
          </span>
        </button>
      </div>
    </div>
  );
}

PaymentReviewCard.propTypes = {
  paymentData: PropTypes.shape({
    amount: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired,
    fromAccountId: PropTypes.string.isRequired,
    loanNumber: PropTypes.string.isRequired,
  }).isRequired,
  account: PropTypes.shape({
    accountName: PropTypes.string.isRequired,
    accountType: PropTypes.string.isRequired,
  }),
  onConfirm: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};
