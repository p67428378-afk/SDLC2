import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import ManagerApprovalTable from "../components/ManagerApprovalTable";
import { timesheetsApi } from "../services/api";
import { AlertCircle } from "lucide-react";

export default function ManagerDashboardPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const data = await timesheetsApi.listTimesheets();
      setEntries(data);
    } catch (err) {
      console.error("Failed to load timesheet submissions:", err);
      setPageError(
        err.response?.data?.detail || "Failed to fetch timesheet submissions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleApprove = async (id) => {
    await timesheetsApi.approveTimesheet(id, {
      status: "approved",
    });
    await loadSubmissions();
  };

  const handleReject = async (id, rejectionReason) => {
    await timesheetsApi.approveTimesheet(id, {
      status: "rejected",
      rejection_reason: rejectionReason,
    });
    await loadSubmissions();
  };

  const handleBulkApprove = async (entryIds) => {
    await timesheetsApi.bulkApprove({
      entry_ids: entryIds,
      status: "approved",
    });
    await loadSubmissions();
  };

  const handleBulkReject = async (entryIds, rejectionReason) => {
    await timesheetsApi.bulkApprove({
      entry_ids: entryIds,
      status: "rejected",
      rejection_reason: rejectionReason,
    });
    await loadSubmissions();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {pageError && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-xs text-red-700"
          >
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{pageError}</span>
          </div>
        )}

        <ManagerApprovalTable
          entries={entries}
          loading={loading}
          onApprove={handleApprove}
          onReject={handleReject}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
        />
      </main>
    </div>
  );
}
