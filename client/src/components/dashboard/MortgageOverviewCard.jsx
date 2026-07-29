import React from "react";

export default function MortgageOverviewCard({ mortgage, onViewDetails }) {
  if (!mortgage) {
    return (
      <div className="bg-primary text-on-primary rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
        <h2 className="font-headline-sm mb-6 relative z-10">
          Mortgage Overview
        </h2>
        <p className="text-primary-fixed-dim relative z-10">
          No active mortgage found.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-primary text-on-primary rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
      {/* Decorative subtle circle */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      <h2 className="font-headline-sm mb-6 relative z-10">Mortgage Overview</h2>
      <div className="flex flex-col gap-4 relative z-10 flex-1">
        <div>
          <span className="font-label-sm text-primary-fixed-dim uppercase tracking-wider block mb-1">
            Principal Balance
          </span>
          <span className="font-headline-md">
            $
            {mortgage.principal_balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="w-full h-[1px] bg-white/20 my-2"></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-label-sm text-primary-fixed-dim uppercase tracking-wider block mb-1">
              Next Payment
            </span>
            <span className="font-body-lg font-medium">
              $
              {mortgage.next_payment_amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="font-body-sm text-primary-fixed block mt-0.5">
              Due {mortgage.next_payment_due}
            </span>
          </div>
          <div>
            <span className="font-label-sm text-primary-fixed-dim uppercase tracking-wider block mb-1">
              Escrow
            </span>
            <span className="font-body-lg font-medium">
              $
              {mortgage.escrow_balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onViewDetails && onViewDetails("cenlar", mortgage.id)}
        className="w-full mt-6 bg-white text-primary font-label-md py-3 px-4 rounded-xl hover:bg-surface-container-lowest transition-colors relative z-10 shadow-sm"
      >
        View Details
      </button>
    </div>
  );
}
