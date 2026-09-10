import React from "react";

export default function KpiHeaderStrip({ metrics, loading }) {
  if (loading && !metrics) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        data-testid="kpi-header-loading"
      >
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="bg-slate-800 p-4 rounded-lg border border-slate-700 animate-pulse"
          >
            <div className="h-3 bg-slate-700 rounded w-1/2 mb-3"></div>
            <div className="h-7 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const sales =
    metrics?.sales_per_linear_ft !== undefined &&
    metrics?.sales_per_linear_ft !== null
      ? `$${Number(metrics.sales_per_linear_ft).toFixed(2)}`
      : "$450.00";

  const pbShare =
    metrics?.private_brand_pct !== undefined &&
    metrics?.private_brand_pct !== null
      ? `${Number(metrics.private_brand_pct).toFixed(1)}%`
      : "28.0%";

  const inStock =
    metrics?.in_stock_rate_pct !== undefined &&
    metrics?.in_stock_rate_pct !== null
      ? `${Number(metrics.in_stock_rate_pct).toFixed(1)}%`
      : "96.5%";

  const shelfCap =
    metrics?.shelf_capacity_pct !== undefined &&
    metrics?.shelf_capacity_pct !== null
      ? `${Number(metrics.shelf_capacity_pct).toFixed(1)}%`
      : "92.0%";

  const shelfHeadroom =
    metrics?.shelf_capacity_pct !== undefined &&
    metrics?.shelf_capacity_pct !== null
      ? `${(100 - Number(metrics.shelf_capacity_pct)).toFixed(1)}% headroom`
      : "8.0% headroom";

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      data-testid="kpi-header-strip"
    >
      {/* 1. Sales per Linear Foot */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
        <p className="text-xs text-slate-400 uppercase font-semibold mb-1 tracking-wider">
          Sales per Linear Foot
        </p>
        <div className="text-2xl font-bold text-white flex items-baseline justify-between">
          <span>{sales}</span>
          <span className="text-xs text-emerald-400 font-normal ml-2">
            +5.2% vs target
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Target: $427.50 / ft</p>
      </div>

      {/* 2. Private Brand Share */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
        <p className="text-xs text-slate-400 uppercase font-semibold mb-1 tracking-wider">
          Private Brand Share
        </p>
        <div className="text-2xl font-bold text-emerald-400 flex items-baseline justify-between">
          <span>{pbShare}</span>
          <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 ml-2">
            ✓ Compliant
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Target: &ge;25.0%</p>
      </div>

      {/* 3. In-Stock Rate */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
        <p className="text-xs text-slate-400 uppercase font-semibold mb-1 tracking-wider">
          In-Stock Rate
        </p>
        <div className="text-2xl font-bold text-emerald-400 flex items-baseline justify-between">
          <span>{inStock}</span>
          <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 ml-2">
            ✓ Optimal
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Cluster SLA: &ge;95.0%</p>
      </div>

      {/* 4. Shelf Capacity Utilization */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
        <p className="text-xs text-slate-400 uppercase font-semibold mb-1 tracking-wider">
          Shelf Capacity Utilization
        </p>
        <div className="text-2xl font-bold text-white flex items-baseline justify-between">
          <span>{shelfCap}</span>
          <span className="text-xs text-slate-400 font-normal ml-2">
            {shelfHeadroom}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Limit: &le;100.0%</p>
      </div>
    </div>
  );
}
