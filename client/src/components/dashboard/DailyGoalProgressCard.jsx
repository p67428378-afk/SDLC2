import React from "react";

export default function DailyGoalProgressCard({ totalSeconds, entries }) {
  const GOAL_SECONDS = 28800; // 8 hours
  const percentage = Math.min(
    Math.round((totalSeconds / GOAL_SECONDS) * 100),
    100,
  );

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  // Calculate breakdown dynamically
  const timedSeconds = entries
    .filter((e) => e.type === "timed")
    .reduce((sum, e) => sum + e.duration_seconds, 0);
  const manualSeconds = entries
    .filter((e) => e.type === "manual")
    .reduce((sum, e) => sum + e.duration_seconds, 0);

  const totalLogged = timedSeconds + manualSeconds;
  const timedPercent =
    totalLogged > 0 ? Math.round((timedSeconds / totalLogged) * 100) : 0;
  const manualPercent =
    totalLogged > 0 ? Math.round((manualSeconds / totalLogged) * 100) : 0;

  // SVG circle properties
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-lg">
        Goal Progress
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center py-xl">
        <div className="relative w-48 h-48 flex items-center justify-center rounded-full bg-surface-container-highest border-[12px] border-surface-container-highest">
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              className="stroke-surface-container-highest"
              cx="50"
              cy="50"
              fill="none"
              r={radius}
              strokeWidth="12"
            ></circle>
            <circle
              className="stroke-primary transition-all duration-500"
              cx="50"
              cy="50"
              fill="none"
              r={radius}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            ></circle>
          </svg>
          <div className="flex flex-col items-center z-10 text-center">
            <span className="font-display-lg text-display-lg text-on-surface leading-none mb-1">
              {percentage}%
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              {formatDuration(totalSeconds)}
            </span>
          </div>
        </div>
        <p className="mt-6 font-label-md text-label-md text-on-surface-variant">
          Daily Goal: 8h 00m
        </p>
      </div>
      <div className="mt-auto space-y-3 pt-4 border-t border-outline-variant/50">
        <div className="flex items-center justify-between font-label-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-on-surface">Timed Work</span>
          </div>
          <span className="text-on-surface-variant">{timedPercent}%</span>
        </div>
        <div className="flex items-center justify-between font-label-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
            <span className="text-on-surface">Manual Log</span>
          </div>
          <span className="text-on-surface-variant">{manualPercent}%</span>
        </div>
      </div>
    </div>
  );
}
