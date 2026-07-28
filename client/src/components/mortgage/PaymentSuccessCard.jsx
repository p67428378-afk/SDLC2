import React from "react";
import { CheckCircle, Download, Calendar, ArrowRight } from "lucide-react";

export default function PaymentSuccessCard({
  receipt,
  onDone,
  onViewScheduled,
}) {
  const {
    amount,
    mortgage_account_id,
    paymentId,
    receiptId,
    source_account_id,
    status,
    timestamp,
    transaction_reference,
  } = receipt;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col gap-lg max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center gap-sm border-b border-outline-variant pb-lg">
        <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#166534] mb-sm">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
          Payment Confirmed
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your payment has been successfully processed and posted.
        </p>
      </div>

      {/* Receipt Details */}
      <div className="flex flex-col gap-md bg-surface-container-low p-lg rounded-xl border border-outline-variant">
        <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
          <span className="text-on-surface-variant font-medium">
            Receipt ID
          </span>
          <span className="font-mono text-on-surface font-semibold">
            {receiptId}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
          <span className="text-on-surface-variant font-medium">
            Transaction Reference
          </span>
          <span className="font-mono text-on-surface font-semibold">
            {transaction_reference}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
          <span className="text-on-surface-variant font-medium">
            Payment ID
          </span>
          <span className="font-mono text-on-surface text-sm">{paymentId}</span>
        </div>
        <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
          <span className="text-on-surface-variant font-medium">
            From Account
          </span>
          <span className="font-mono text-on-surface font-semibold">
            ****{source_account_id.slice(-4)}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
          <span className="text-on-surface-variant font-medium">
            To Mortgage
          </span>
          <span className="font-mono text-on-surface font-semibold">
            Loan #{mortgage_account_id}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
          <span className="text-on-surface-variant font-medium">
            Date &amp; Time
          </span>
          <span className="text-on-surface font-semibold">
            {new Date(timestamp).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
          <span className="text-on-surface-variant font-medium">Status</span>
          <span className="inline-flex items-center gap-xs px-2 py-1 bg-[#F0FDF4] text-[#166534] rounded-full font-label-md text-[11px] uppercase tracking-wide border border-[#DCFCE7]">
            {status}
          </span>
        </div>
        <div className="flex justify-between items-center pt-sm font-bold text-on-surface">
          <span>Amount Paid</span>
          <span className="font-mono text-xl">
            $
            {amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-md pt-md">
        <button
          onClick={onViewScheduled}
          className="w-full sm:w-1/2 h-12 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm hover:bg-surface-container-low transition-colors"
        >
          <Calendar className="w-5 h-5" />
          View Scheduled Payments
        </button>
        <button
          onClick={onDone}
          className="w-full sm:w-1/2 h-12 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm hover:bg-[#4338CA] transition-colors shadow-sm group"
        >
          Back to Details
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
