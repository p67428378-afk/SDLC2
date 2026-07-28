import React from "react";

export default function LoanInfoGrid({ mortgage }) {
  if (!mortgage) return null;

  const details = [
    { label: "Interest Rate", value: `${mortgage.interestRate}%` },
    { label: "Maturity Date", value: mortgage.maturityDate },
    { label: "Original Term", value: mortgage.loanTerm },
    {
      label: "Escrow Balance",
      value: `$${mortgage.escrowBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    },
    {
      label: "Minimum Payment Due",
      value: `$${mortgage.minimumPaymentDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    },
    { label: "Next Payment Due Date", value: mortgage.nextPaymentDueDate },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {details.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {item.label}
          </p>
          <p className="text-lg font-bold text-slate-800">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
