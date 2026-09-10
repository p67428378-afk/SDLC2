import React from "react";

export default function ApprovalReviewPanel({
  selectedScenario = "Balanced",
  guardrailStatus = {
    all_passed: true,
    guardrails: [
      {
        name: "Shelf Capacity",
        status: "PASSED",
        message: "Within limits (8.0% headroom)",
        value: 92.0,
        threshold: 100.0,
        operator: "<=",
      },
      {
        name: "Private Brand Share",
        status: "PASSED",
        message: "Exceeds target by +3.0%",
        value: 28.0,
        threshold: 25.0,
        operator: ">=",
      },
      {
        name: "In-Stock SLA Rate",
        status: "PASSED",
        message: "Cluster SLA satisfied",
        value: 96.5,
        threshold: 95.0,
        operator: ">=",
      },
    ],
  },
  onSubmit,
  submitting = false,
  skuCount = 12,
  error = null,
}) {
  const guardrails = guardrailStatus?.guardrails || [];
  const allPassed =
    guardrailStatus?.all_passed ??
    guardrails.every((g) => g.status === "PASSED");
  const passedCount = guardrails.filter((g) => g.status === "PASSED").length;
  const totalCount = guardrails.length;

  return (
    <div
      className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-sm mb-6"
      data-testid="approval-review-panel"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Approval Review Panel & Guardrail Verification
          </h2>
          <p className="text-xs text-slate-400">
            Current Plan:{" "}
            <span className="text-[#FFC200] font-semibold">
              {selectedScenario} Scenario
            </span>{" "}
            ({skuCount} SKU actions queued)
          </p>
        </div>
        <div>
          {allPassed ? (
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <span>✓</span> All Guardrails Passed ({passedCount}/
              {totalCount || 3})
            </span>
          ) : (
            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <span>⚠</span> Guardrail Violations ({passedCount}/
              {totalCount || 3} Passed)
            </span>
          )}
        </div>
      </div>

      {/* 3 Guardrail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {guardrails.map((g, idx) => {
          const isPassed = g.status === "PASSED";
          let displayVal = `${g.value !== undefined ? g.value : ""}%`;
          if (g.name === "Shelf Capacity") {
            displayVal = `${g.value || 92.0}% / ${g.threshold || 100.0}%`;
          } else if (g.name === "Private Brand Share") {
            displayVal = `${g.value || 28.0}% (Min: ${g.threshold || 25.0}%)`;
          } else if (g.name === "In-Stock SLA Rate") {
            displayVal = `${g.value || 96.5}% (Min: ${g.threshold || 95.0}%)`;
          }

          return (
            <div
              key={idx}
              className={`bg-slate-900 p-3.5 rounded border flex items-center space-x-3 transition-colors ${
                isPassed
                  ? "border-emerald-900/50"
                  : "border-rose-900/60 bg-rose-950/20"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  isPassed
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
              >
                {isPassed ? "✓" : "✕"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 truncate">{g.name}</p>
                <p className="text-sm font-bold text-white truncate">
                  {displayVal}
                </p>
                <p
                  className={`text-[11px] truncate ${isPassed ? "text-emerald-400" : "text-rose-400 font-medium"}`}
                >
                  {g.message || (isPassed ? "Passed" : "Violated")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 bg-rose-950/50 border border-rose-600/50 p-3 rounded text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-400">Submission Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-700 pt-4 gap-3">
        <div className="text-xs text-slate-400">
          Ready to finalize assortment plan for Small Town Value Cluster (1,420
          stores).
        </div>
        <button
          onClick={onSubmit}
          disabled={!allPassed || submitting}
          className={`font-bold px-6 py-2.5 rounded shadow text-sm transition-all flex items-center gap-2 ${
            !allPassed
              ? "bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600"
              : submitting
                ? "bg-[#FFC200]/70 text-slate-900 cursor-wait"
                : "bg-[#FFC200] hover:bg-[#e0b000] text-slate-950 active:scale-[0.98]"
          }`}
          data-testid="submit-assortment-plan-btn"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></div>
              <span>Submitting Plan...</span>
            </>
          ) : (
            <span>Submit Assortment Plan</span>
          )}
        </button>
      </div>
    </div>
  );
}
