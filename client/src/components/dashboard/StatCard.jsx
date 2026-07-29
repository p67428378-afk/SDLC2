import React from "react";

export default function StatCard({
  title,
  value,
  icon,
  badge,
  subtext,
  isNegative = false,
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="font-label-md text-secondary">{title}</span>
        <span
          className={`material-symbols-outlined ${isNegative ? "text-error" : "text-primary"}`}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-headline-lg ${isNegative ? "text-error" : "text-on-surface"}`}
        >
          {value}
        </span>
      </div>
      {badge && (
        <div className="mt-2 inline-flex items-center gap-1 bg-tertiary-container/10 text-tertiary px-2 py-0.5 rounded-full font-label-sm">
          <span className="material-symbols-outlined text-[14px]">
            trending_up
          </span>
          {badge}
        </div>
      )}
      {subtext && <p className="font-body-sm text-secondary mt-2">{subtext}</p>}
    </div>
  );
}
