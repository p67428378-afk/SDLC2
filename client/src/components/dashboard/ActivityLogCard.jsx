import React from "react";

export default function ActivityLogCard({ entries, onDeleteEntry }) {
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimeRange = (entry) => {
    if (entry.started_at && entry.ended_at) {
      const start = new Date(entry.started_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const end = new Date(entry.ended_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${start} - ${end}`;
    }
    return entry.logged_date || "Manual Entry";
  };

  return (
    <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col">
      <div className="p-md border-b border-outline-variant flex justify-between items-center">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Activity Log
        </h3>
        <button className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container/50">
              <th className="p-md font-label-sm text-on-surface-variant font-medium">
                Type
              </th>
              <th className="p-md font-label-sm text-on-surface-variant font-medium">
                Description
              </th>
              <th className="p-md font-label-sm text-on-surface-variant font-medium">
                Time/Date
              </th>
              <th className="p-md font-label-sm text-on-surface-variant font-medium">
                Duration
              </th>
              <th className="p-md font-label-sm text-on-surface-variant font-medium text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/50">
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-md text-center text-on-surface-variant"
                >
                  No time entries logged for today.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-surface-container-highest/30 transition-colors"
                >
                  <td className="p-md">
                    {entry.type === "timed" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[12px]">
                          timer
                        </span>{" "}
                        Timer
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-secondary-container text-on-secondary-container">
                        <span className="material-symbols-outlined text-[12px]">
                          keyboard
                        </span>{" "}
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="p-md font-medium text-on-surface">
                    {entry.description || "No description"}
                  </td>
                  <td className="p-md text-on-surface-variant">
                    {formatTimeRange(entry)}
                  </td>
                  <td className="p-md tabular-nums font-medium">
                    {formatDuration(entry.duration_seconds)}
                  </td>
                  <td className="p-md text-right">
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-on-surface-variant hover:text-error transition-colors"
                      title="Delete Entry"
                    >
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
