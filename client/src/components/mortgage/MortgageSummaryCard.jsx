import React from "react";
import { ArrowRight } from "lucide-react";

export default function MortgageSummaryCard({
  balance,
  dueDate,
  minDue,
  onMakePayment,
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
      <div className="flex flex-col gap-md">
        <div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-xs">
            Outstanding Balance
          </p>
          <div className="text-[36px] leading-[44px] font-bold text-on-surface tracking-tight">
            $
            {balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-lg sm:gap-xl">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">
              Next Payment Due Date
            </p>
            <p className="font-headline-md text-headline-md text-on-surface">
              {dueDate}
            </p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">
              Minimum Payment Due
            </p>
            <p className="font-headline-md text-headline-md text-on-surface">
              $
              {minDue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>
      {onMakePayment && (
        <button
          onClick={onMakePayment}
          className="w-full md:w-auto h-12 px-xl bg-primary-container text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm hover:bg-[#4338CA] transition-colors shadow-sm whitespace-nowrap group"
        >
          Make Payment
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
}
