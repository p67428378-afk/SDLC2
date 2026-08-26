import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { projectsAPI, timesheetsAPI } from "../services/api";
import CalendarGrid from "../components/CalendarGrid";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  RefreshCw,
} from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  // Calculate Monday of current week
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(
    getMonday(new Date()),
  );
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryTimeframe, setSummaryTimeframe] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState("");

  // Get week end date (Sunday)
  const getWeekEnd = (monday) => {
    const end = new Date(monday);
    end.setDate(end.getDate() + 6);
    return end;
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDateStr = currentWeekStart.toISOString().split("T")[0];
      const endDateStr = getWeekEnd(currentWeekStart)
        .toISOString()
        .split("T")[0];

      const [projs, timesheetData, summary] = await Promise.all([
        projectsAPI.listProjects({ include_inactive: false }),
        timesheetsAPI.listTimesheets({
          user_id: user?.id,
          start_date: startDateStr,
          end_date: endDateStr,
        }),
        timesheetsAPI
          .getSummary({
            timeframe: summaryTimeframe,
            start_date: startDateStr,
            end_date: endDateStr,
            user_id: user?.id,
          })
          .catch(() => null),
      ]);

      setProjects(projs || []);
      setEntries(timesheetData || []);
      setSummaryData(summary);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to load dashboard data";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, user?.id, summaryTimeframe]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleTodayWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const handleSaveEntry = async (entryPayload) => {
    setError(null);
    if (entryPayload.id) {
      // Update existing
      await timesheetsAPI.updateTimesheet(entryPayload.id, {
        project_id: entryPayload.project_id,
        hours_worked: entryPayload.hours_worked,
        description: entryPayload.description,
      });
      setSuccessNotice("Timesheet entry updated successfully!");
    } else {
      // Create new
      await timesheetsAPI.createTimesheet({
        project_id: entryPayload.project_id,
        date: entryPayload.date,
        hours_worked: entryPayload.hours_worked,
        description: entryPayload.description,
      });
      setSuccessNotice("Timesheet entry logged successfully!");
    }
    setTimeout(() => setSuccessNotice(""), 4000);
    await loadDashboardData();
  };

  const handleDeleteEntry = async (entryId) => {
    setError(null);
    await timesheetsAPI.deleteTimesheet(entryId);
    setSuccessNotice("Timesheet entry removed successfully.");
    setTimeout(() => setSuccessNotice(""), 4000);
    await loadDashboardData();
  };

  // Metrics calculation for the current week
  const totalWeeklyHours = entries.reduce(
    (sum, e) => sum + Number(e.hours_worked || 0),
    0,
  );
  const pendingHours = entries
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + Number(e.hours_worked || 0), 0);
  const approvedHours = entries
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + Number(e.hours_worked || 0), 0);
  const rejectedHours = entries
    .filter((e) => e.status === "rejected")
    .reduce((sum, e) => sum + Number(e.hours_worked || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171c29] tracking-tight">
            Employee Timesheet
          </h1>
          <p className="text-sm text-[#707a8c] mt-1">
            Log and manage your daily working hours across active projects
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-[#e3e8f0] text-[#171c29] hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200"
        >
          {error}
        </div>
      )}

      {successNotice && (
        <div
          role="status"
          className="p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Metric Cards Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e3e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#707a8c] uppercase tracking-wider">
              Total Logged
            </p>
            <h3 className="text-2xl font-extrabold text-[#171c29] mt-1">
              {totalWeeklyHours.toFixed(1)} hrs
            </h3>
            <p className="text-xs text-[#707a8c] mt-0.5">Target: 40.0 hrs</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2663eb] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e3e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#707a8c] uppercase tracking-wider">
              Approved
            </p>
            <h3 className="text-2xl font-extrabold text-green-600 mt-1">
              {approvedHours.toFixed(1)} hrs
            </h3>
            <p className="text-xs text-[#707a8c] mt-0.5">
              {((approvedHours / (totalWeeklyHours || 1)) * 100).toFixed(0)}% of
              total
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e3e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#707a8c] uppercase tracking-wider">
              Pending
            </p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
              {pendingHours.toFixed(1)} hrs
            </h3>
            <p className="text-xs text-[#707a8c] mt-0.5">
              Awaiting manager review
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e3e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#707a8c] uppercase tracking-wider">
              Rejected
            </p>
            <h3 className="text-2xl font-extrabold text-red-600 mt-1">
              {rejectedHours.toFixed(1)} hrs
            </h3>
            <p className="text-xs text-[#707a8c] mt-0.5">Needs correction</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Weekly Calendar Matrix */}
      <CalendarGrid
        currentWeekStart={currentWeekStart}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onTodayWeek={handleTodayWeek}
        projects={projects}
        entries={entries}
        onSaveEntry={handleSaveEntry}
        onDeleteEntry={handleDeleteEntry}
        isLoading={loading}
      />

      {/* Project Hours Summary Breakdown */}
      {summaryData && (
        <div className="bg-white p-6 rounded-xl border border-[#e3e8f0] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#2663eb]" />
              <h2 className="text-lg font-bold text-[#171c29]">
                Hours Summary Aggregation
              </h2>
            </div>
            <div className="flex rounded-lg border border-[#e3e8f0] p-0.5 bg-gray-50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSummaryTimeframe("weekly")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  summaryTimeframe === "weekly"
                    ? "bg-white shadow-sm text-[#2663eb]"
                    : "text-[#707a8c] hover:text-[#171c29]"
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setSummaryTimeframe("monthly")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  summaryTimeframe === "monthly"
                    ? "bg-white shadow-sm text-[#2663eb]"
                    : "text-[#707a8c] hover:text-[#171c29]"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {summaryData.items && summaryData.items.length > 0 ? (
              summaryData.items.map((item) => (
                <div
                  key={item.project_id}
                  className="p-4 bg-[#f7fafc] rounded-lg border border-[#e3e8f0]"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm text-[#171c29]">
                      {item.project_name}
                    </span>
                    <span className="text-xs font-bold text-[#2663eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {Number(item.total_hours).toFixed(1)} hrs
                    </span>
                  </div>
                  <p className="text-xs text-[#707a8c] mt-2">
                    {item.entry_count} entries logged
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#707a8c] col-span-full py-4 text-center">
                No aggregation entries recorded for this period.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
