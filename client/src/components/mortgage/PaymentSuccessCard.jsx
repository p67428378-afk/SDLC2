import React from "react";
import PropTypes from "prop-types";

export default function PaymentSuccessCard({
  result,
  onDownloadReceipt,
  onGoToDetails,
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col gap-lg items-center text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#166534] mb-sm">
        <span className="material-symbols-outlined text-[40px] filled">
          check_circle
        </span>
      </div>

      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
          Payment Submitted Successfully!
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your payment has been received and is being processed.
        </p>
      </div>

      <div className="w-full border border-outline-variant rounded-lg overflow-hidden text-left my-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-outline-variant">
          <div className="p-md bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Fiserv Transaction ID
          </div>
          <div className="p-md font-data-mono text-data-mono text-on-surface font-medium">
            {result.transactionId}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-outline-variant">
          <div className="p-md bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Cenlar Confirmation ID
          </div>
          <div className="p-md font-data-mono text-data-mono text-on-surface font-medium">
            {result.cenlarConfirmationId}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-outline-variant">
          <div className="p-md bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Payment Status
          </div>
          <div className="p-md font-body-md text-body-md text-on-surface font-semibold text-[#166534]">
            {result.status}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-md bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Submission Timestamp
          </div>
          <div className="p-md font-body-md text-body-md text-on-surface">
            {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-md w-full justify-center mt-md">
        <button
          type="button"
          onClick={onDownloadReceipt}
          className="h-12 px-xl border border-outline-variant text-primary rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-sm"
        >
          <span className="material-symbols-outlined text-[20px]">
            download
          </span>
          Download Receipt
        </button>
        <button
          type="button"
          onClick={onGoToDetails}
          className="h-12 px-xl bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-[#4338CA] transition-colors shadow-sm flex items-center justify-center gap-sm"
        >
          Back to Mortgage Details
          <span className="material-symbols-outlined text-[20px]">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}

PaymentSuccessCard.propTypes = {
  result: PropTypes.shape({
    transactionId: PropTypes.string.isRequired,
    cenlarConfirmationId: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
  }).isRequired,
  onDownloadReceipt: PropTypes.func.isRequired,
  onGoToDetails: PropTypes.func.isRequired,
};
