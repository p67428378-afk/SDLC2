import React from "react";

export default function ScenarioSelector({
  selectedScenario,
  onScenarioSelect,
  scenariosData,
}) {
  const scenarios = [
    { name: "Conservative", key: "Conservative" },
    { name: "Balanced", key: "Balanced" },
    { name: "Aggressive", key: "Aggressive" },
  ];

  return (
    <div>
      <h3 class="font-headline-sm text-headline-sm text-on-surface mb-md">
        Assortment Scenario Modeling
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario === sc.key;
          const data = scenariosData[sc.key];

          return (
            <div
              key={sc.key}
              onClick={() => onScenarioSelect(sc.key)}
              class={`bg-surface-container-lowest rounded-lg p-md hover:shadow-sm transition-all cursor-pointer flex flex-col h-full border-2 ${
                isSelected
                  ? "border-primary-container shadow-sm relative"
                  : "border-outline-variant/50"
              }`}
            >
              {isSelected && (
                <div class="absolute -top-3 -right-3 w-6 h-6 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container border-2 border-surface-container-lowest">
                  <span
                    class="material-symbols-outlined text-[16px]"
                    data-icon="check"
                    data-weight="fill"
                  >
                    check
                  </span>
                </div>
              )}
              <div class="flex justify-between items-center mb-sm">
                <h4 class="font-label-md text-label-md font-bold text-on-surface">
                  {sc.name}
                </h4>
              </div>
              <div class="space-y-sm mt-auto">
                <div class="flex justify-between items-center border-b border-outline-variant/20 pb-xs">
                  <span class="font-label-sm text-label-sm text-secondary">
                    Proj. Sales Growth
                  </span>
                  <span class="font-body-sm text-body-sm font-medium">
                    {data ? `${data.projected_sales_growth_pct}%` : "..."}
                  </span>
                </div>
                <div class="flex justify-between items-center border-b border-outline-variant/20 pb-xs">
                  <span class="font-label-sm text-label-sm text-secondary">
                    Private Brand
                  </span>
                  <span class="font-body-sm text-body-sm font-medium">
                    {data ? `${data.projected_private_brand_pct}%` : "..."}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-label-sm text-label-sm text-secondary">
                    In-Stock
                  </span>
                  <span class="font-body-sm text-body-sm font-medium">
                    {data ? `${data.projected_in_stock_rate}%` : "..."}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
