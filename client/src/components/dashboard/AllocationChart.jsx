import React from "react";

export default function AllocationChart({ accounts }) {
  // Calculate totals by type
  const totals = accounts.reduce(
    (acc, account) => {
      const type = account.type.toLowerCase();
      if (type.includes("savings")) {
        acc.savings += account.balance;
      } else if (type.includes("cd")) {
        acc.cd += account.balance;
      } else if (type.includes("checking")) {
        acc.checking += account.balance;
      } else if (type.includes("mortgage")) {
        acc.mortgage += account.balance;
      }
      return acc;
    },
    { savings: 0, cd: 0, checking: 0, mortgage: 0 },
  );

  const totalDeposits = totals.savings + totals.cd + totals.checking;
  const displayTotal = totalDeposits > 0 ? totalDeposits : 112150;

  // Calculate percentages
  const savingsPct =
    totalDeposits > 0 ? (totals.savings / totalDeposits) * 100 : 76;
  const cdPct = totalDeposits > 0 ? (totals.cd / totalDeposits) * 100 : 13;
  const checkingPct =
    totalDeposits > 0 ? (totals.checking / totalDeposits) * 100 : 11;

  // SVG stroke-dasharray calculations (circumference of r=40 is 2 * pi * 40 = 251.2)
  const circ = 251.2;
  const savingsOffset = 0;
  const savingsDash = (savingsPct / 100) * circ;

  const cdOffset = -savingsDash;
  const cdDash = (cdPct / 100) * circ;

  const checkingOffset = -(savingsDash + cdDash);
  const checkingDash = (checkingPct / 100) * circ;

  const formatK = (val) => {
    return `$${(val / 1000).toFixed(1)}k`;
  };

  return (
    <div className="card-surface rounded-xl p-md flex flex-col h-[320px]">
      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-md">
        Asset Allocation
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-[180px] h-[180px]">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Savings */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="40"
              stroke="#8083ff"
              strokeDasharray={`${savingsDash} ${circ - savingsDash}`}
              strokeDashoffset={savingsOffset}
              strokeWidth="20"
            />
            {/* CD */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="40"
              stroke="#4edea3"
              strokeDasharray={`${cdDash} ${circ - cdDash}`}
              strokeDashoffset={cdOffset}
              strokeWidth="20"
            />
            {/* Checking */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="40"
              stroke="#94A3B8"
              strokeDasharray={`${checkingDash} ${circ - checkingDash}`}
              strokeDashoffset={checkingOffset}
              strokeWidth="20"
            />
          </svg>
          {/* Inner Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-label-md text-on-surface-variant">
              Deposits
            </span>
            <span className="font-headline-md text-on-surface">
              {formatK(displayTotal)}
            </span>
          </div>
        </div>
        {/* Legend */}
        <div className="mt-md w-full flex justify-between px-sm gap-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#8083ff]"></span>
            <span className="font-label-md text-on-surface-variant">
              Sav ({savingsPct.toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#4edea3]"></span>
            <span className="font-label-md text-on-surface-variant">
              CD ({cdPct.toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#94A3B8]"></span>
            <span className="font-label-md text-on-surface-variant">
              Chk ({checkingPct.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
