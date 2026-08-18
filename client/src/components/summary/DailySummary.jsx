import React from "react";
import { Calendar, PieChart } from "lucide-react";

export default function DailySummary({
  summaryData,
  selectedDate,
  onDateChange,
  isLoading,
}) {
  const totalFormatted = summaryData?.formatted_total || "0h 0m";
  const projectSummaries = summaryData?.projects || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Daily Summary
          </h2>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none pr-2 cursor-pointer"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Time Today
        </span>
        <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight">
          {totalFormatted}
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">
          Loading daily summary...
        </div>
      ) : projectSummaries.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500 italic">
          No time logged for this date (0h 0m).
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Time by Project
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projectSummaries.map((p) => {
              const totalSec = summaryData?.total_duration_seconds || 1;
              const percentage = Math.round(
                ((p.total_duration_seconds || 0) / totalSec) * 100,
              );

              return (
                <div
                  key={p.project_id}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-800 flex-shrink-0"
                        style={{ backgroundColor: p.color_code || "#6B7280" }}
                      />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {p.project_name}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                      {p.entries_count}{" "}
                      {p.entries_count === 1 ? "entry" : "entries"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {p.formatted_duration}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(2, percentage))}%`,
                        backgroundColor: p.color_code || "#3B82F6",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
