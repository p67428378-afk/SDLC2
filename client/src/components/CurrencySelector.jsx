import React from "react";
import { DollarSign, RefreshCw } from "lucide-react";

export const CurrencySelector = ({
  selectedCurrency,
  onCurrencyChange,
  exchangeRates,
  loadingRates,
  onRefreshRates,
}) => {
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  ];

  const currentRate = exchangeRates?.[selectedCurrency] || 1.0;

  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          Settlement Currency
        </label>
        {onRefreshRates && (
          <button
            type="button"
            onClick={onRefreshRates}
            disabled={loadingRates}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            title="Refresh exchange rates"
          >
            <RefreshCw
              className={`w-3 h-3 ${loadingRates ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-3">
        <select
          value={selectedCurrency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="block w-full rounded-md border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {currencies.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.code} ({curr.symbol}) - {curr.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCurrency !== "USD" && (
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Current Rate (vs USD):</span>
          <span className="font-semibold text-slate-700">
            1 USD = {currentRate.toFixed(4)} {selectedCurrency}
          </span>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
