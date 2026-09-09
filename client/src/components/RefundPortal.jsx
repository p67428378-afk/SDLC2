import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
  History,
  X,
  DollarSign,
  Filter,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import {
  listTransactions,
  getTransactionDetail,
  createRefund,
  listAuditLogs,
} from "../services/api";

export const RefundPortal = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal / Detail State
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [txDetail, setTxDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Refund Form State
  const [refundType, setRefundType] = useState("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Customer Request");
  const [refundMemo, setRefundMemo] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState("");
  const [refundError, setRefundError] = useState("");

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      const data = await listTransactions(params);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (txId) => {
    try {
      const data = await listAuditLogs({ transaction_id: txId, limit: 10 });
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load audit logs:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleOpenDetailModal = async (txId) => {
    setSelectedTxId(txId);
    setLoadingDetail(true);
    setTxDetail(null);
    setRefundError("");
    setRefundSuccessMsg("");

    try {
      const data = await getTransactionDetail(txId);
      setTxDetail(data);
      setRefundAmount(
        data.remaining_refundable_balance?.toFixed(2) ||
          data.amount?.toFixed(2) ||
          "0.00",
      );
      fetchAuditLogs(txId);
    } catch (err) {
      setRefundError(err.message || "Failed to fetch transaction details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTxId(null);
    setTxDetail(null);
    setRefundSuccessMsg("");
    setRefundError("");
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!txDetail) return;

    setRefundError("");
    setRefundSuccessMsg("");

    const parsedAmount = parseFloat(refundAmount);
    const maxRefundable =
      txDetail.remaining_refundable_balance ?? txDetail.amount;

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setRefundError("Please enter a valid refund amount > 0");
      return;
    }

    if (parsedAmount > maxRefundable) {
      setRefundError(
        `Refund amount cannot exceed remaining balance of $${maxRefundable.toFixed(2)}`,
      );
      return;
    }

    if (!refundReason.trim()) {
      setRefundError("Mandatory refund reason required");
      return;
    }

    setIsSubmittingRefund(true);

    try {
      const payload = {
        transaction_id: txDetail.id,
        amount: parsedAmount,
        reason: refundReason,
        memo: refundMemo || undefined,
      };

      const refundResult = await createRefund(payload);
      setRefundSuccessMsg(
        `Refund of $${refundResult.refund_amount.toFixed(2)} issued successfully! Status: ${refundResult.status}`,
      );

      // Refresh transaction detail & transaction list
      const updatedDetail = await getTransactionDetail(txDetail.id);
      setTxDetail(updatedDetail);
      fetchTransactions();
      fetchAuditLogs(txDetail.id);
    } catch (err) {
      setRefundError(err.message || "Failed to submit refund");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-indigo-600" />
            Refund Management Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search transaction history, inspect detail breakdowns, issue
            refunds, and review audit trails.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh List
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Search by Transaction ID or Customer Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer Email</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {tx.id}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {tx.customer_email}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {tx.currency} {tx.amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">
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
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetailModal(tx.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect / Refund
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection & Refund Modal */}
      {selectedTxId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  Transaction Inspection & Refund
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedTxId}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {loadingDetail ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Fetching transaction details...</span>
                </div>
              ) : txDetail ? (
                <>
                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">
                        Original Amount
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {txDetail.target_currency ||
                          txDetail.base_currency ||
                          "USD"}{" "}
                        {txDetail.converted_amount?.toFixed(2) ||
                          txDetail.amount?.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">
                        Refunded Total
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        ${txDetail.refunded_amount?.toFixed(2) || "0.00"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">
                        Remaining Refundable
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        $
                        {txDetail.remaining_refundable_balance?.toFixed(2) ||
                          "0.00"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">
                        Status
                      </span>
                      <div className="mt-0.5">
                        <StatusBadge status={txDetail.status} />
                      </div>
                    </div>
                  </div>

                  {refundError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{refundError}</span>
                    </div>
                  )}

                  {refundSuccessMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{refundSuccessMsg}</span>
                    </div>
                  )}

                  {/* Refund Processing Form */}
                  {(txDetail.remaining_refundable_balance ?? txDetail.amount) >
                  0 ? (
                    <form
                      onSubmit={handleRefundSubmit}
                      className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-4"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-indigo-600" />
                        Trigger Refund
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            Refund Type
                          </label>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="refundType"
                                value="full"
                                checked={refundType === "full"}
                                onChange={() => {
                                  setRefundType("full");
                                  setRefundAmount(
                                    (
                                      txDetail.remaining_refundable_balance ??
                                      txDetail.amount
                                    ).toFixed(2),
                                  );
                                }}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>Full Refund</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="refundType"
                                value="partial"
                                checked={refundType === "partial"}
                                onChange={() => setRefundType("partial")}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>Partial Refund</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            Refund Amount ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            disabled={refundType === "full"}
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            max={
                              txDetail.remaining_refundable_balance ??
                              txDetail.amount
                            }
                            className="block w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            Reason <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            className="block w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="Customer Request">
                              Customer Request
                            </option>
                            <option value="Duplicate Charge">
                              Duplicate Charge
                            </option>
                            <option value="Fraudulent Transaction">
                              Fraudulent Transaction
                            </option>
                            <option value="Order Cancellation">
                              Order Cancellation
                            </option>
                            <option value="Customer Dissatisfaction">
                              Customer Dissatisfaction
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            Internal Memo (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Approval ticket #..."
                            value={refundMemo}
                            onChange={(e) => setRefundMemo(e.target.value)}
                            className="block w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isSubmittingRefund ||
                          parseFloat(refundAmount) <= 0 ||
                          parseFloat(refundAmount) >
                            (txDetail.remaining_refundable_balance ??
                              txDetail.amount)
                        }
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmittingRefund ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing Refund...</span>
                          </>
                        ) : (
                          <span>Submit Refund</span>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="bg-slate-100 p-3 rounded-lg text-center text-xs text-slate-500 font-medium">
                      This transaction is fully refunded or non-refundable.
                    </div>
                  )}

                  {/* Audit Trail Section */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-indigo-600" />
                      PCI Audit Trail Timeline
                    </h4>
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono max-h-40 overflow-y-auto space-y-2">
                      {auditLogs.length === 0 ? (
                        <p className="text-slate-500 italic">
                          No audit records logged yet.
                        </p>
                      ) : (
                        auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="border-b border-slate-800 pb-1.5 last:border-0 last:pb-0"
                          >
                            <span className="text-indigo-400 font-semibold">
                              {log.event_type}
                            </span>{" "}
                            •{" "}
                            <span className="text-slate-400">
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString()
                                : "N/A"}
                            </span>
                            <pre className="text-[10px] text-slate-400 mt-0.5 overflow-x-auto">
                              {JSON.stringify(log.masked_payload, null, 2)}
                            </pre>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundPortal;
