import React, { useState } from "react";

export default function SKUPerformanceTable({
  skus,
  loading,
  error,
  onFilterChange,
  onSortChange,
}) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleStatusChange = (e) => {
    const val = e.target.value;
    setSelectedStatus(val);
    onFilterChange(val);
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSelectedSort(val);
    onSortChange(val);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-lg overflow-hidden flex flex-col">
      <div class="p-md border-b border-outline-variant/50 bg-surface flex justify-between items-center">
        <h3 class="font-headline-sm text-headline-sm text-on-surface">
          Snacks SKU Performance — Small Town Value Cluster
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          class="text-primary hover:bg-surface-variant/20 p-2 rounded transition-colors flex items-center gap-1"
          title="Filter and Sort"
        >
          <span
            class="material-symbols-outlined"
            data-icon="filter_list"
            data-weight="fill"
          >
            filter_list
          </span>
          <span class="text-sm font-medium">Filter/Sort</span>
        </button>
      </div>

      {showFilters && (
        <div class="p-md bg-surface-container-low border-b border-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label class="block text-xs font-bold text-secondary uppercase mb-1">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded p-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="GROW">GROW</option>
              <option value="MAINTAIN">MAINTAIN</option>
              <option value="SWAP">SWAP</option>
              <option value="REDUCE">REDUCE</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-secondary uppercase mb-1">
              Sort by Field
            </label>
            <select
              value={selectedSort}
              onChange={handleSortChange}
              class="w-full bg-surface-container-lowest border border-outline-variant/50 rounded p-2 text-sm"
            >
              <option value="">Default</option>
              <option value="sales">Sales ($)</option>
              <option value="units_sold">Units Sold</option>
              <option value="sales_per_linear_ft">Sales/Lin Ft</option>
            </select>
          </div>
        </div>
      )}

      <div class="overflow-x-auto">
        {loading ? (
          <div class="p-lg text-center text-secondary">
            Loading SKU performance data...
          </div>
        ) : error ? (
          <div class="p-lg text-center text-error">
            Error loading SKU data. Showing offline fallback.
          </div>
        ) : !skus || skus.length === 0 ? (
          <div class="p-lg text-center text-secondary">
            No SKUs found matching the criteria.
          </div>
        ) : (
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container-low font-label-sm text-label-sm text-secondary uppercase border-b border-outline-variant/50">
              <tr>
                <th class="p-md font-medium">SKU #</th>
                <th class="p-md font-medium">Product Name</th>
                <th class="p-md font-medium text-right">Sales ($)</th>
                <th class="p-md font-medium text-right">Units Sold</th>
                <th class="p-md font-medium text-right">Sales/Lin Ft</th>
                <th class="p-md font-medium text-center">Brand</th>
                <th class="p-md font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody class="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant/30">
              {skus.map((sku) => (
                <tr
                  key={sku.sku_id}
                  class="hover:bg-surface-container/30 transition-colors h-[40px]"
                >
                  <td class="p-md font-label-md text-label-md">{sku.sku_id}</td>
                  <td class="p-md">{sku.product_name}</td>
                  <td class="p-md text-right font-medium">
                    {formatCurrency(sku.sales)}
                  </td>
                  <td class="p-md text-right">
                    {sku.units_sold.toLocaleString()}
                  </td>
                  <td class="p-md text-right">
                    ${sku.sales_per_linear_ft.toFixed(2)}
                  </td>
                  <td class="p-md text-center">
                    {sku.is_private_brand ? (
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-primary-fixed text-on-primary-fixed uppercase tracking-wide border border-primary-fixed-dim/50">
                        Private
                      </span>
                    ) : (
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-surface-variant text-on-surface-variant uppercase tracking-wide border border-outline-variant/50">
                        National
                      </span>
                    )}
                  </td>
                  <td class="p-md text-center">
                    <span
                      class={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                        sku.status === "GROW"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary-fixed-dim/50"
                          : sku.status === "MAINTAIN"
                            ? "bg-secondary-container text-on-secondary-container border-secondary-fixed-dim/50"
                            : sku.status === "REDUCE"
                              ? "bg-error-container text-on-error-container border-error/20"
                              : "bg-surface-variant text-on-surface-variant border-outline-variant/50"
                      }`}
                    >
                      {sku.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
