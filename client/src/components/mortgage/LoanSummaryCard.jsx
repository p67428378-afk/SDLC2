import React from "react";
import PropTypes from "prop-types";

export default function LoanSummaryCard({
  details,
  onMakePaymentClick,
  showCta = true,
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
      <div className="flex flex-col gap-md">
        <div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-xs">
            Outstanding Balance
          </p>
          <div className="text-[36px] leading-[44px] font-bold text-on-surface tracking-tight">
            {formatCurrency(details.currentBalance)}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-lg sm:gap-xl">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">
              Next Payment Due Date
            </p>
            <p className="font-headline-md text-headline-md text-on-surface">
              {details.nextPaymentDueDate}
            </p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">
              Minimum Payment Due
            </p>
            <p className="font-headline-md text-headline-md text-on-surface">
              {formatCurrency(details.minimumPaymentAmount)}
            </p>
          </div>
        </div>
      </div>
      {showCta && (
        <button
          onClick={onMakePaymentClick}
          className="w-full md:w-auto h-12 px-xl bg-primary-container text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm hover:bg-[#4338CA] transition-colors shadow-sm whitespace-nowrap group"
        >
          Make Payment
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      )}
    </div>
  );
}

LoanSummaryCard.propTypes = {
  details: PropTypes.shape({
    currentBalance: PropTypes.number.isRequired,
    nextPaymentDueDate: PropTypes.string.isRequired,
    minimumPaymentAmount: PropTypes.number.isRequired,
  }).isRequired,
  onMakePaymentClick: PropTypes.func,
  showCta: PropTypes.bool,
};
