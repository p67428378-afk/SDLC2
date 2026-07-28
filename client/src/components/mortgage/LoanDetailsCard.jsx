import React from "react";
import { Percent, Shield, Calendar } from "lucide-react";

export default function LoanDetailsCard({
  interestRate,
  escrowBalance,
  loanTerm,
  maturityDate,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-lg">
      {/* Interest Rate */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -z-10 group-hover:scale-110 transition-transform opacity-50"></div>
        <div className="flex justify-between items-start mb-sm">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <Percent className="w-5 h-5" />
          </div>
          <span className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded-full font-label-md text-[10px] uppercase tracking-wide">
            Fixed Rate
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Interest Rate
        </p>
        <p className="font-headline-lg text-headline-lg text-on-surface">
          {interestRate}%
        </p>
      </div>

      {/* Escrow Balance */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -z-10 group-hover:scale-110 transition-transform opacity-50"></div>
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-sm">
          <Shield className="w-5 h-5" />
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Escrow Balance{" "}
          <span className="text-xs opacity-70">(Taxes &amp; Ins)</span>
        </p>
        <p className="font-headline-lg text-headline-lg text-on-surface">
          $
          {escrowBalance.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Loan Term */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -z-10 group-hover:scale-110 transition-transform opacity-50"></div>
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-sm">
          <Calendar className="w-5 h-5" />
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Loan Term
        </p>
        <p className="font-headline-md text-headline-md text-on-surface">
          {loanTerm}
        </p>
        <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
          Maturity Date: {maturityDate}
        </p>
      </div>
    </div>
  );
}
