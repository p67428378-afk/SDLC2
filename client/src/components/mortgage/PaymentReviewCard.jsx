import React from "react";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";

export default function PaymentReviewCard({
  data,
  mortgageAccount,
  onConfirm,
  onBack,
  isSubmitting,
  error,
}) {
  const { source_account_id, amount, payment_type, scheduled_date } = data;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col gap-lg">
      <div className="flex items-center gap-sm border-b border-outline-variant pb-md">
        <button
          onClick={onBack}
          className="p-xs hover:bg-surface-container rounded-full transition-colors"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </button>
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Review Your Payment
        </h2>
      </div>

      {error && (
        <div className="p-md bg-error-container text-on-error-container rounded-lg flex items-start gap-sm border border-error/20">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-error" />
          <div className="font-body-sm text-body-sm">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="flex flex-col gap-xs">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            From (Source Account)
          </span>
          <span className="font-headline-md text-headline-md text-on-surface">
            Account ****{source_account_id.slice(-4)}
          </span>
        </div>

        <div className="flex flex-col gap-xs">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            To (Mortgage Account)
          </span>
          <span className="font-headline-md text-headline-md text-on-surface">
            Loan #{mortgageAccount}
          </span>
        </div>

        <div className="flex flex-col gap-xs">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Payment Amount
          </span>
          <span className="font-headline-md text-headline-md text-on-surface font-mono">
            $
            {amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex flex-col gap-xs">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Payment Date
          </span>
          <span className="font-headline-md text-headline-md text-on-surface">
            {payment_type === "IMMEDIATE"
              ? "Immediate (Today)"
              : `Scheduled for ${scheduled_date}`}
          </span>
        </div>
      </div>

      {/* Atomicity Notice */}
      <div className="p-md bg-surface-container-low rounded-lg flex items-start gap-sm border border-outline-variant">
        <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
        <div className="font-body-sm text-body-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">
            Transaction Protection:
          </span>{" "}
          Your payment is protected by our real-time transaction guarantee. If
          the mortgage posting fails after your account is debited, the funds
          will be automatically returned to your source account immediately.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-md pt-md border-t border-outline-variant">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-1/2 h-12 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-label-md flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-50"
        >
          Back to Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full sm:w-1/2 h-12 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm hover:bg-[#4338CA] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            "Confirm & Submit"
          )}
        </button>
      </div>
    </div>
  );
}
