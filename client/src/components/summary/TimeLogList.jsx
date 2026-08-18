import React from "react";
import { ListFilter, Trash2, Clock } from "lucide-react";
import { format_seconds_to_hm } from "../../utils/formatters";

export default function TimeLogList({
  entries = [],
  onDeleteEntry,
  isLoading,
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ListFilter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Detailed Time Logs
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full">
          {entries.length} {entries.length === 1 ? "log" : "logs"}
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">
          Loading logs...
        </div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">
            No time entries recorded for this date.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {entries.map((entry) => {
            const projectColor = entry.project?.color_code || "#6B7280";
            const projectName = entry.project?.name || "Unassigned";
            const formattedDuration = format_seconds_to_hm(
              entry.duration_seconds,
            );

            return (
              <div
                key={entry.id}
                className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-50/80 dark:hover:bg-slate-700/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-slate-800"
                    style={{ backgroundColor: projectColor }}
                    title={projectName}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {entry.description || "No description"}
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {projectName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/80 px-2.5 py-1 rounded-lg">
                    {formattedDuration}
                  </span>

                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete time entry"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
