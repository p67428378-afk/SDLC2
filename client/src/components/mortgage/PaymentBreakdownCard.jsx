import React from "react";

export default function PaymentBreakdownCard({ amount }) {
  const principal = amount * 0.4;
  const interest = amount * 0.45;
  const escrow = amount * 0.15;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col gap-md">
      <h3 className="font-headline-md text-headline-md text-on-surface">
        Estimated Payment Breakdown
      </h3>
      <div className="flex flex-col gap-sm">
        <div className="flex justify-between items-center py-xs border-b border-outline-variant">
          <span className="text-on-surface-variant">Principal</span>
          <span className="font-mono font-medium text-on-surface">
            $
            {principal.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between items-center py-xs border-b border-outline-variant">
          <span className="text-on-surface-variant">Interest</span>
          <span className="font-mono font-medium text-on-surface">
            $
            {interest.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between items-center py-xs border-b border-outline-variant">
          <span className="text-on-surface-variant">
            Escrow (Taxes &amp; Insurance)
          </span>
          <span className="font-mono font-medium text-on-surface">
            $
            {escrow.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between items-center pt-sm font-bold text-on-surface">
          <span>Total Payment</span>
          <span className="font-mono text-lg">
            $
            {amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
