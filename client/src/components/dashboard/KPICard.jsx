import React from "react";

export default function KPICard({ title, value, icon, trend, trendUp = true }) {
  return (
    <div className="card-surface rounded-xl p-md flex flex-col justify-between h-[140px]">
      <div className="flex justify-between items-start">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          {title}
        </h3>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <div>
        <div className="flex items-end gap-sm">
          <span className="font-headline-lg text-headline-lg text-on-surface">
            {value}
          </span>
          {trend && (
            <span
              className={`flex items-center font-label-md text-label-md mb-1 px-2 py-1 rounded-full ${
                trendUp
                  ? "text-secondary bg-secondary/10"
                  : "text-error bg-error/10"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] mr-1">
                {trendUp ? "trending_up" : "trending_down"}
              </span>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
