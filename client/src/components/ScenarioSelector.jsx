import React from "react";

const SCENARIO_DEFAULTS = {
  Conservative: {
    name: "Conservative",
    lift: "+3.2%",
    pb: "26.5%",
    margin: "+0.8%",
    description:
      "Low-risk baseline optimization protecting high-velocity national snack staples while gradually elevating private brand margins.",
    actions: "12 Total (2 GROW, 8 MAINTAIN, 1 SWAP, 1 REDUCE)",
    actionsSummary: { GROW: 2, MAINTAIN: 8, SWAP: 1, REDUCE: 1 },
  },
  Balanced: {
    name: "Balanced",
    lift: "+5.8%",
    pb: "28.0%",
    margin: "+1.5%",
    description:
      "Optimal equilibrium between high-velocity national brands and margin-expanding Dollar General private label products.",
    actions: "12 Total (4 GROW, 5 MAINTAIN, 2 SWAP, 1 REDUCE)",
    actionsSummary: { GROW: 4, MAINTAIN: 5, SWAP: 2, REDUCE: 1 },
  },
  Aggressive: {
    name: "Aggressive",
    lift: "+8.5%",
    pb: "31.2%",
    margin: "+2.4%",
    description:
      "Aggressive private brand expansion and shelf reallocation maximizing gross margin dollars in value-seeking rural markets.",
    actions: "12 Total (6 GROW, 2 MAINTAIN, 3 SWAP, 1 REDUCE)",
    actionsSummary: { GROW: 6, MAINTAIN: 2, SWAP: 3, REDUCE: 1 },
  },
};

export default function ScenarioSelector({
  selectedScenario = "Balanced",
  onSelectScenario,
  scenarioEvaluations = {},
}) {
  const scenarios = ["Conservative", "Balanced", "Aggressive"];

  const getScenarioData = (type) => {
    const defaultData = SCENARIO_DEFAULTS[type] || SCENARIO_DEFAULTS.Balanced;
    const liveEval = scenarioEvaluations[type];
    if (!liveEval) return defaultData;

    const lift =
      liveEval.projected_sales_lift_pct !== undefined
        ? `${liveEval.projected_sales_lift_pct >= 0 ? "+" : ""}${Number(liveEval.projected_sales_lift_pct).toFixed(1)}% Lift`
        : defaultData.lift;

    const pb =
      liveEval.projected_private_brand_share_pct !== undefined
        ? `${Number(liveEval.projected_private_brand_share_pct).toFixed(1)}%`
        : defaultData.pb;

    const margin =
      liveEval.projected_margin_delta_pct !== undefined
        ? `${liveEval.projected_margin_delta_pct >= 0 ? "+" : ""}${Number(liveEval.projected_margin_delta_pct).toFixed(1)}%`
        : defaultData.margin;

    let actions = defaultData.actions;
    if (
      liveEval.recommended_sku_actions &&
      typeof liveEval.recommended_sku_actions === "object"
    ) {
      const g = liveEval.recommended_sku_actions.GROW || 0;
      const m = liveEval.recommended_sku_actions.MAINTAIN || 0;
      const s = liveEval.recommended_sku_actions.SWAP || 0;
      const r = liveEval.recommended_sku_actions.REDUCE || 0;
      const total = g + m + s + r;
      actions = `${total} Total (${g} GROW, ${m} MAINTAIN, ${s} SWAP, ${r} REDUCE)`;
    }

    return {
      ...defaultData,
      lift,
      pb,
      margin,
      actions,
    };
  };

  const currentData = getScenarioData(selectedScenario);

  return (
    <div
      className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-sm flex flex-col h-full"
      data-testid="scenario-selector"
    >
      <h2 className="text-lg font-bold text-white mb-4">
        Planogram Scenario Selector
      </h2>

      {/* 3 Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {scenarios.map((type) => {
          const isSelected = selectedScenario === type;
          const data = getScenarioData(type);

          return (
            <div
              key={type}
              role="button"
              tabIndex={0}
              onClick={() => onSelectScenario && onSelectScenario(type)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectScenario && onSelectScenario(type);
                }
              }}
              className={`p-3 rounded-lg cursor-pointer transition-all relative ${
                isSelected
                  ? "border-2 border-[#FFC200] bg-slate-900 shadow-lg scale-[1.02]"
                  : "border border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900/80"
              }`}
              data-testid={`scenario-card-${type.toLowerCase()}`}
            >
              {isSelected && (
                <span className="absolute -top-2 right-2 bg-[#FFC200] text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                  Active
                </span>
              )}
              <p
                className={`font-bold text-sm ${isSelected ? "text-[#FFC200]" : "text-slate-300"}`}
              >
                {type}
              </p>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                {data.lift.includes("Lift") ? data.lift : `${data.lift} Lift`}
              </p>
              <p
                className={`text-[11px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}
              >
                PB: {data.pb}
              </p>
              <p
                className={`text-[11px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}
              >
                Margin: {data.margin}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Scenario Detailed Box */}
      <div className="bg-slate-900/80 p-3.5 rounded border border-slate-700 text-xs text-slate-300 mt-auto">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-white">
            {selectedScenario} Scenario Summary
          </p>
          <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
            Selected for Execution
          </span>
        </div>
        <p className="text-slate-400 mb-3 text-[11px] leading-relaxed">
          {currentData.description}
        </p>
        <div className="flex flex-col sm:flex-row justify-between border-t border-slate-800 pt-2 text-[11px] gap-1">
          <span className="text-slate-400">Queued SKU Actions:</span>
          <span className="font-semibold text-white">
            {currentData.actions}
          </span>
        </div>
      </div>
    </div>
  );
}
