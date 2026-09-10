import React, { useState } from "react";

const getBadgeStyle = (status) => {
  switch ((status || "").toUpperCase()) {
    case "GROW":
      return "bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded text-xs border border-emerald-500/30";
    case "SWAP":
      return "bg-rose-500/20 text-rose-400 font-bold px-2 py-1 rounded text-xs border border-rose-500/30";
    case "REDUCE":
      return "bg-amber-500/20 text-amber-400 font-bold px-2 py-1 rounded text-xs border border-amber-500/30";
    case "MAINTAIN":
    default:
      return "bg-slate-600/30 text-slate-300 font-bold px-2 py-1 rounded text-xs border border-slate-500/30";
  }
};

export default function SkuPerformanceTable({
  skus = [],
  loading = false,
  onActionChange,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSkus = skus.filter((sku) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (sku.sku_code && sku.sku_code.toLowerCase().includes(term)) ||
      (sku.product_name && sku.product_name.toLowerCase().includes(term)) ||
      (sku.status_badge && sku.status_badge.toLowerCase().includes(term))
    );
  });

  return (
    <div
      className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-sm flex flex-col h-full"
      data-testid="sku-performance-table"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            SKU Performance Table (Snacks)
          </h2>
          <p className="text-xs text-slate-400">
            Small Town Value Cluster assortment velocity & margins
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU or product..."
            aria-label="Search SKU or product"
            className="bg-slate-900 border border-slate-700 text-xs rounded px-3 py-1.5 text-white w-full sm:w-56 focus:outline-none focus:border-[#FFC200] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1.5 text-slate-400 hover:text-white text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto flex-1 max-h-[340px] overflow-y-auto border border-slate-750 rounded">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 uppercase font-semibold sticky top-0 z-10">
            <tr>
              <th className="p-2.5">SKU Code</th>
              <th className="p-2.5">Product Name</th>
              <th className="p-2.5 text-right">Velocity (/wk)</th>
              <th className="p-2.5 text-right">Margin %</th>
              <th className="p-2.5 text-right">Linear Ft</th>
              <th className="p-2.5 text-center">Private Brand</th>
              <th className="p-2.5 text-center">Status Badge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading && skus.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-[#FFC200] border-t-transparent mr-2"></div>
                  Loading SKU telemetry...
                </td>
              </tr>
            ) : filteredSkus.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  {searchTerm
                    ? `No SKUs match "${searchTerm}"`
                    : "No SKUs available"}
                </td>
              </tr>
            ) : (
              filteredSkus.map((sku) => (
                <tr
                  key={sku.id || sku.sku_code}
                  className="hover:bg-slate-700/50 transition-colors"
                >
                  <td className="p-2.5 font-mono text-white font-medium">
                    {sku.sku_code}
                  </td>
                  <td className="p-2.5 font-medium text-white">
                    {sku.product_name}
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    {sku.weekly_velocity !== undefined
                      ? Number(sku.weekly_velocity).toFixed(1)
                      : "-"}
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    {sku.margin_pct !== undefined
                      ? `${Number(sku.margin_pct).toFixed(1)}%`
                      : "-"}
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    {sku.linear_feet !== undefined
                      ? Number(sku.linear_feet).toFixed(1)
                      : "-"}
                  </td>
                  <td className="p-2.5 text-center">
                    {sku.is_private_brand ? (
                      <span className="bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-700/40">
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">No</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    {onActionChange ? (
                      <select
                        value={sku.status_badge || "MAINTAIN"}
                        onChange={(e) =>
                          onActionChange(sku.sku_code, e.target.value)
                        }
                        className={`text-xs font-bold rounded px-1.5 py-0.5 cursor-pointer bg-slate-900 border focus:outline-none focus:ring-1 focus:ring-[#FFC200] ${getBadgeStyle(
                          sku.status_badge,
                        )}`}
                        aria-label={`Action badge for ${sku.sku_code}`}
                      >
                        <option value="GROW">GROW</option>
                        <option value="MAINTAIN">MAINTAIN</option>
                        <option value="SWAP">SWAP</option>
                        <option value="REDUCE">REDUCE</option>
                      </select>
                    ) : (
                      <span className={getBadgeStyle(sku.status_badge)}>
                        {sku.status_badge || "MAINTAIN"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex justify-between items-center text-[11px] text-slate-400">
        <span>
          Showing {filteredSkus.length} of {skus.length} SKUs
        </span>
        <span>Snacks Category · Store Cluster 04</span>
      </div>
    </div>
  );
}
