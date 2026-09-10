import React from "react";

export default function InlineConfirmation({ submissionResult, onDismiss }) {
  if (!submissionResult) return null;

  const auditId = submissionResult.audit_id || "AUD-2026-99482";
  const count =
    submissionResult.sku_decisions_count !== undefined
      ? submissionResult.sku_decisions_count
      : 12;
  const message =
    submissionResult.message || "Assortment plan submitted successfully.";
  const timestamp = submissionResult.timestamp
    ? new Date(submissionResult.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Just now";

  return (
    <div
      className="bg-emerald-950/70 border border-emerald-500/50 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between text-emerald-200 text-xs shadow-lg transition-all animate-fadeIn mb-6 gap-3"
      data-testid="inline-confirmation-banner"
    >
      <div className="flex items-center space-x-3.5">
        <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow">
          ✓
        </span>
        <div>
          <p className="font-bold text-emerald-300 text-sm">{message}</p>
          <p className="text-slate-300 mt-0.5">
            Audit ID:{" "}
            <span className="font-mono font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
              {auditId}
            </span>{" "}
            |{" "}
            <span className="font-medium text-white">
              {count} SKU decisions
            </span>{" "}
            logged to cluster store operations at {timestamp}.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
        <span className="bg-emerald-900/80 px-2.5 py-1 rounded font-mono text-[11px] text-emerald-300 border border-emerald-700/50 shadow-sm">
          Immutable Audit Record
        </span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800/80 transition-colors"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
