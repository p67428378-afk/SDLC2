import React from "react";

const AllocationChart = ({ accounts = [] }) => {
  // Filter only deposit accounts (Savings, Checking, CD)
  const depositAccounts = accounts.filter(
    (acc) =>
      acc.institution === "Fiserv" ||
      ["savings", "checking", "cd"].includes(acc.type?.toLowerCase()),
  );

  const totalDeposits = depositAccounts.reduce(
    (sum, acc) => sum + acc.balance,
    0,
  );

  const breakdown = depositAccounts.reduce((acc, curr) => {
    const type = curr.type?.toLowerCase() || "other";
    if (!acc[type]) acc[type] = 0;
    acc[type] += curr.balance;
    return acc;
  }, {});

  const savingsVal = breakdown["savings"] || breakdown["savings account"] || 0;
  const checkingVal =
    breakdown["checking"] || breakdown["checking account"] || 0;
  const cdVal = breakdown["cd"] || breakdown["certificate of deposit"] || 0;

  const savingsPct =
    totalDeposits > 0 ? Math.round((savingsVal / totalDeposits) * 100) : 0;
  const checkingPct =
    totalDeposits > 0 ? Math.round((checkingVal / totalDeposits) * 100) : 0;
  const cdPct =
    totalDeposits > 0 ? Math.round((cdVal / totalDeposits) * 100) : 0;

  // SVG stroke-dasharray calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.3

  const savingsDash = (savingsPct / 100) * circumference;
  const cdDash = (cdPct / 100) * circumference;
  const checkingDash = (checkingPct / 100) * circumference;

  const formatK = (val) => {
    return `$${(val / 1000).toFixed(1)}k`;
  };

  return (
    <div className="lg:col-span-4 card-surface rounded-xl p-md flex flex-col h-[320px]">
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
              r={radius}
              stroke="#8083ff"
              strokeDasharray={`${savingsDash} ${circumference}`}
              strokeDashoffset={0}
              strokeWidth="20"
            />
            {/* CD */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r={radius}
              stroke="#4edea3"
              strokeDasharray={`${cdDash} ${circumference}`}
              strokeDashoffset={-savingsDash}
              strokeWidth="20"
            />
            {/* Checking */}
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r={radius}
              stroke="#94A3B8"
              strokeDasharray={`${checkingDash} ${circumference}`}
              strokeDashoffset={-(savingsDash + cdDash)}
              strokeWidth="20"
            />
          </svg>
          {/* Inner Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-label-md text-on-surface-variant">
              Deposits
            </span>
            <span className="font-headline-md text-on-surface">
              {formatK(totalDeposits)}
            </span>
          </div>
        </div>
        {/* Legend */}
        <div className="mt-md w-full flex justify-between px-sm gap-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#8083ff]"></span>
            <span className="font-label-md text-on-surface-variant">
              Sav ({savingsPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#4edea3]"></span>
            <span className="font-label-md text-on-surface-variant">
              CD ({cdPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#94A3B8]"></span>
            <span className="font-label-md text-on-surface-variant">
              Chk ({checkingPct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationChart;
