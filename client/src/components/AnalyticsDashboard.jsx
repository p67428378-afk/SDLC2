import React, { useState, useEffect } from "react";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Layers,
  Webhook,
  Filter,
  Search,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import WebhookLogViewer from "./WebhookLogViewer";
import { listTransactions } from "../services/api";

export const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("ledger"); // 'ledger' | 'webhooks'
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (currency) params.currency = currency;
      const data = await listTransactions(params);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load transaction ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [status, currency]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLedger();
  };

  // Derived Metrics
  const totalCount = transactions.length;
  const totalVolume = transactions.reduce(
    (sum, tx) => sum + (tx.amount || 0),
    0,
  );
  const successfulRevenue = transactions
    .filter((tx) =>
      ["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(
        (tx.status || "").toUpperCase(),
      ),
    )
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const refundedTotal = transactions
    .filter((tx) =>
      ["REFUNDED", "PARTIALLY_REFUNDED"].includes(
        (tx.status || "").toUpperCase(),
      ),
    )
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Transaction Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time financial revenue metrics, multi-currency ledger, and
            webhook delivery status.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ledger"
                ? "bg-white text-indigo-600 shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ledger & Revenue
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "webhooks"
                ? "bg-white text-indigo-600 shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Webhook Logs</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Volume
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            $
            {totalVolume.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Gross processed across all currencies
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Successful Revenue
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            $
            {successfulRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium">
            Settled 2xx completed payments
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Refunded Total
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-600">
            $
            {refundedTotal.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <span className="text-[11px] text-purple-600/80 font-medium">
            Total issued refunds
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Transaction Count
            </span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Total transactions recorded
          </span>
        </div>
      </div>

      {activeTab === "ledger" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Transaction Ledger
            </h2>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search ID or Email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-48"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </form>

              <div className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-lg px-2 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-lg px-2 py-1.5">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 font-medium"
                >
                  <option value="">All Currencies</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>

              <button
                onClick={fetchLedger}
                className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors"
                title="Refresh Ledger"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      Loading ledger entries...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      <div className="space-y-2">
                        <p>No transactions match the selected filters.</p>
                        <button
                          onClick={() => {
                            setSearch("");
                            setStatus("");
                            setCurrency("");
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {tx.id}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.customer_email}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${tx.amount?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold border border-slate-200">
                          {tx.currency || "USD"}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600 text-xs">
                        {tx.payment_method || "card"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <WebhookLogViewer />
      )}
    </div>
  );
};

export default AnalyticsDashboard;
