import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { timesheetsApi } from "../services/api";

export default function HoursAnalyticsCard() {
  const [period, setPeriod] = useState("weekly");
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSummary();
  }, [period]);

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await timesheetsApi.getSummary({ period });
      setSummaryData(data);
    } catch (err) {
      console.error("Failed to load summary analytics:", err);
      setError("Failed to load hours analytics.");
    } finally {
      setLoading(false);
    }
  };

  const totalHours = summaryData?.total_hours || 0;
  const approvedHours = summaryData?.by_status?.approved || 0;
  const pendingHours = summaryData?.by_status?.pending || 0;
  const rejectedHours = summaryData?.by_status?.rejected || 0;
  const projectList = summaryData?.by_project || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6">
      {/* Header and Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            Hours Aggregation & Analytics
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor team productivity and project time distribution
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1 rounded-md font-medium transition ${
              period === "weekly"
                ? "bg-white text-primary font-semibold shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Weekly Summary
          </button>
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1 rounded-md font-medium transition ${
              period === "monthly"
                ? "bg-white text-primary font-semibold shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly Summary
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-xs text-gray-500">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900">
                  Total Worked
                </span>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-extrabold text-blue-900 mt-2">
                {totalHours.toFixed(1)}{" "}
                <span className="text-sm font-normal text-blue-700">hrs</span>
              </div>
              <div className="text-[11px] text-blue-700 mt-1 capitalize">
                {period} window ({summaryData?.start_date} to{" "}
                {summaryData?.end_date})
              </div>
            </div>

            <div className="bg-green-50/70 border border-green-100 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-900">
                  Approved Hours
                </span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-extrabold text-green-900 mt-2">
                {approvedHours.toFixed(1)}{" "}
                <span className="text-sm font-normal text-green-700">hrs</span>
              </div>
              <div className="text-[11px] text-green-700 mt-1">
                {totalHours > 0
                  ? `${((approvedHours / totalHours) * 100).toFixed(0)}% of total`
                  : "0%"}
              </div>
            </div>

            <div className="bg-yellow-50/70 border border-yellow-100 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-yellow-900">
                  Pending Review
                </span>
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-2xl font-extrabold text-yellow-900 mt-2">
                {pendingHours.toFixed(1)}{" "}
                <span className="text-sm font-normal text-yellow-700">hrs</span>
              </div>
              <div className="text-[11px] text-yellow-700 mt-1">
                {totalHours > 0
                  ? `${((pendingHours / totalHours) * 100).toFixed(0)}% of total`
                  : "0%"}
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-100 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-900">
                  Rejected Hours
                </span>
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-extrabold text-red-900 mt-2">
                {rejectedHours.toFixed(1)}{" "}
                <span className="text-sm font-normal text-red-700">hrs</span>
              </div>
              <div className="text-[11px] text-red-700 mt-1">
                {totalHours > 0
                  ? `${((rejectedHours / totalHours) * 100).toFixed(0)}% of total`
                  : "0%"}
              </div>
            </div>
          </div>

          {/* Project Distribution Breakdown */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Project Distribution
            </h3>

            {projectList.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                No project hours recorded for this {period} window.
              </p>
            ) : (
              <div className="space-y-2.5">
                {projectList.map((item) => {
                  const percentage =
                    totalHours > 0 ? (item.hours / totalHours) * 100 : 0;
                  return (
                    <div key={item.project_id} className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-800">
                          {item.project_name}
                        </span>
                        <span className="text-gray-600 font-medium">
                          {item.hours.toFixed(1)} hrs ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(2, percentage))}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
