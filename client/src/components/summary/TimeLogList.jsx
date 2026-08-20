import React from "react";

export default function TimeLogList({
  entries = [],
  onDeleteEntry,
  isLoading = false,
}) {
  const formatSeconds = (totalSecs) => {
    if (!totalSecs) return "0h 0m";
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>📋</span> Today's Logged Entries
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          Loading entries...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          No entries recorded for today.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Duration</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {entries.map((entry) => {
                const projectName = entry.project?.name || "Unassigned";
                const projectColor = entry.project?.color_code || "#3B82F6";

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: projectColor }}
                        />
                        <span>{projectName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {entry.description || "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                          entry.type === "timer"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                        }`}
                      >
                        {entry.type === "timer" ? "Timer" : "Manual"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {formatSeconds(entry.duration_seconds)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {onDeleteEntry && (
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 transition-colors"
                          title="Delete entry"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
