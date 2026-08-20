import React from "react";

export default function DailySummary({ dailySummary }) {
  const formattedTotal = dailySummary?.formatted_total || "0h 0m";
  const projectsSummary = dailySummary?.projects || [];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>📊</span> Daily Summary
        </h2>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
          Total Hours Today: {formattedTotal}
        </span>
      </div>

      {projectsSummary.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          No time logged for today yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projectsSummary.map((item) => (
            <div
              key={item.project_id || item.project_name}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/30"
            >
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: item.color_code || "#3B82F6" }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.project_name}
                </span>
              </div>
              <span className="text-sm font-semibold font-mono text-gray-700 dark:text-gray-300 shrink-0">
                {item.formatted_duration || "0h 0m"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
