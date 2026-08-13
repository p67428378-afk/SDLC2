import React from "react";

export default function KPIHeaderStrip({ kpis, loading, error }) {
  // Fallback values matching stitch_html
  const defaultKPIs = {
    sales_per_linear_ft: 1245.5,
    private_brand_pct: 24.5,
    in_stock_rate: 96.2,
    shelf_capacity: 4500,
  };

  const data = kpis || defaultKPIs;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  return (
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
      {/* Sales per Linear Ft */}
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-md flex items-center justify-between">
        <div>
          <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-xs">
            Sales per Linear Ft
          </p>
          <p class="font-headline-md text-headline-md text-on-surface font-semibold">
            {loading ? "..." : formatCurrency(data.sales_per_linear_ft)}
          </p>
        </div>
        <div class="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
          <span
            class="material-symbols-outlined"
            data-icon="trending_up"
            data-weight="fill"
          >
            trending_up
          </span>
        </div>
      </div>

      {/* Private Brand % */}
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-md flex items-center justify-between">
        <div>
          <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-xs">
            Private Brand %
          </p>
          <p class="font-headline-md text-headline-md text-on-surface font-semibold flex items-baseline gap-sm">
            {loading ? "..." : `${data.private_brand_pct}%`}
            <span class="font-label-sm text-label-sm text-secondary font-normal text-[10px]">
              Target: 25.0%
            </span>
          </p>
        </div>
        <div class="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
          <span
            class="material-symbols-outlined"
            data-icon="award_star"
            data-weight="fill"
          >
            award_star
          </span>
        </div>
      </div>

      {/* In-Stock Rate */}
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-md flex items-center justify-between">
        <div>
          <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-xs">
            In-Stock Rate
          </p>
          <p class="font-headline-md text-headline-md text-on-surface font-semibold text-primary">
            {loading ? "..." : `${data.in_stock_rate}%`}
          </p>
        </div>
        <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
          <span
            class="material-symbols-outlined"
            data-icon="check_circle"
            data-weight="fill"
          >
            check_circle
          </span>
        </div>
      </div>

      {/* Shelf Capacity */}
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-md flex items-center justify-between">
        <div>
          <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-xs">
            Shelf Capacity
          </p>
          <p class="font-headline-md text-headline-md text-on-surface font-semibold flex items-baseline gap-sm">
            {loading ? "..." : data.shelf_capacity.toLocaleString()}{" "}
            <span class="font-body-sm text-body-sm font-normal text-secondary">
              units
            </span>
          </p>
          <p class="font-label-sm text-label-sm text-secondary mt-xs">
            92% utilized
          </p>
        </div>
        <div class="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
          <span
            class="material-symbols-outlined"
            data-icon="grid_view"
            data-weight="fill"
          >
            grid_view
          </span>
        </div>
      </div>
    </section>
  );
}
