import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  CheckSquare,
  Square,
  MessageSquare,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function ManagerApprovalTable({
  entries = [],
  loading = false,
  onApprove,
  onReject,
  onBulkApprove,
  onBulkReject,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [targetRejectId, setTargetRejectId] = useState(null); // null for bulk reject
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesStatus =
      statusFilter === "all" || entry.status === statusFilter;
    const userEmail = entry.user?.email?.toLowerCase() || "";
    const projName = entry.project?.name?.toLowerCase() || "";
    const desc = entry.description?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !query ||
      userEmail.includes(query) ||
      projName.includes(query) ||
      desc.includes(query);

    return matchesStatus && matchesQuery;
  });

  const allFilteredPending = filteredEntries.filter(
    (e) => e.status === "pending",
  );
  const allSelected =
    allFilteredPending.length > 0 &&
    allFilteredPending.every((e) => selectedIds.includes(e.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredPending.map((e) => e.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSingleApprove = async (id) => {
    setActionError("");
    setProcessing(true);
    try {
      await onApprove(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      setActionError(
        err.response?.data?.detail || err.message || "Failed to approve entry",
      );
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (id = null) => {
    setTargetRejectId(id);
    setRejectionReason("");
    setActionError("");
    setRejectionModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setActionError("Please provide a reason for rejection.");
      return;
    }

    setProcessing(true);
    try {
      if (targetRejectId) {
        await onReject(targetRejectId, rejectionReason.trim());
        setSelectedIds((prev) =>
          prev.filter((item) => item !== targetRejectId),
        );
      } else {
        if (selectedIds.length === 0) return;
        await onBulkReject(selectedIds, rejectionReason.trim());
        setSelectedIds([]);
      }
      setRejectionModalOpen(false);
    } catch (err) {
      setActionError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to reject timesheets",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApproveClick = async () => {
    if (selectedIds.length === 0) return;
    setActionError("");
    setProcessing(true);
    try {
      await onBulkApprove(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      setActionError(
        err.response?.data?.detail || err.message || "Failed to bulk approve",
      );
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status, reason) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
              Rejected
            </span>
            {reason && (
              <span className="text-[11px] text-red-600 mt-0.5 italic">
                Reason: {reason}
              </span>
            )}
          </div>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3.5 h-3.5 mr-1 text-yellow-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Top Filter and Actions Bar */}
      <div className="p-4 sm:p-6 border-b border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-primary" />
              Timesheet Approvals
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review, approve, or reject employee timesheets across all active
              projects
            </p>
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleBulkApproveClick}
              disabled={selectedIds.length === 0 || processing}
              className="inline-flex items-center px-3.5 py-1.5 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Bulk Approve ({selectedIds.length})
            </button>
            <button
              type="button"
              onClick={() => openRejectModal(null)}
              disabled={selectedIds.length === 0 || processing}
              className="inline-flex items-center px-3.5 py-1.5 border border-red-300 rounded-lg shadow-sm text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Bulk Reject ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-700">Status:</span>
            {["pending", "approved", "rejected", "all"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition ${
                  statusFilter === status
                    ? "bg-primary text-white font-semibold"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search employee, project, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-xs text-red-700"
          >
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
          <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
            <tr>
              <th scope="col" className="px-4 py-3 w-10">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="p-1 text-gray-500 hover:text-gray-900"
                  title="Select all pending"
                  aria-label="Select all pending entries"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                Employee
              </th>
              <th scope="col" className="px-4 py-3">
                Date
              </th>
              <th scope="col" className="px-4 py-3">
                Project
              </th>
              <th scope="col" className="px-4 py-3">
                Hours
              </th>
              <th scope="col" className="px-4 py-3">
                Description
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 text-gray-800">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  Loading submissions...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-4 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <CheckSquare className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="font-medium">
                      No timesheet submissions found.
                    </p>
                    <p className="text-gray-400 mt-1">
                      There are no entries matching the current filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const isPending = entry.status === "pending";
                const isSelected = selectedIds.includes(entry.id);

                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-gray-50 transition ${
                      isSelected ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(entry.id)}
                          aria-label={`Select entry ${entry.id}`}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {entry.user?.email ||
                        "User: " + entry.user_id.substring(0, 8)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {entry.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                        {entry.project?.name ||
                          "Project: " + entry.project_id.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">
                      {parseFloat(entry.hours_worked).toFixed(1)} hrs
                    </td>
                    <td
                      className="px-4 py-3 max-w-xs truncate text-gray-600"
                      title={entry.description}
                    >
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(entry.status, entry.rejection_reason)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSingleApprove(entry.id)}
                            disabled={processing}
                            className="inline-flex items-center px-2.5 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-semibold transition"
                            title="Approve"
                            aria-label={`Approve entry ${entry.id}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectModal(entry.id)}
                            disabled={processing}
                            className="inline-flex items-center px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-semibold transition"
                            title="Reject"
                            aria-label={`Reject entry ${entry.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rejection Feedback Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center space-x-2 text-red-600 font-bold text-sm mb-3">
              <MessageSquare className="w-5 h-5" />
              <span>
                {targetRejectId
                  ? "Reject Timesheet Entry"
                  : `Bulk Reject (${selectedIds.length}) Entries`}
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Please enter a constructive rejection reason to explain why this
              timesheet cannot be approved.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label
                  className="block font-semibold text-gray-700 mb-1"
                  htmlFor="rejection-reason-input"
                >
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejection-reason-input"
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Incomplete task description or hours exceed expected allocation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition"
                >
                  {processing ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
