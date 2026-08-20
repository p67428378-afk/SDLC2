import React, { useState, useEffect, useCallback } from "react";
import TimerControl from "../components/timer/TimerControl.jsx";
import DailySummary from "../components/summary/DailySummary.jsx";
import TimeLogList from "../components/summary/TimeLogList.jsx";
import ProjectManagementModal from "../components/projects/ProjectManagementModal.jsx";
import ManualEntryModal from "../components/manual/ManualEntryModal.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  getProjects,
  getDailySummary,
  listTimeEntries,
  createTimeEntry,
  deleteTimeEntry,
} from "../services/api.js";

export default function DashboardPage() {
  const { darkMode, toggleTheme } = useTheme();

  const [projects, setProjects] = useState([]);
  const [dailySummary, setDailySummary] = useState({
    formatted_total: "0h 0m",
    projects: [],
  });
  const [timeEntries, setTimeEntries] = useState([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [projData, summaryData, entriesData] = await Promise.all([
        getProjects().catch(() => []),
        getDailySummary(todayStr).catch(() => ({
          formatted_total: "0h 0m",
          projects: [],
        })),
        listTimeEntries({ entry_date: todayStr }).catch(() => []),
      ]);

      setProjects(projData || []);
      setDailySummary(
        summaryData || { formatted_total: "0h 0m", projects: [] },
      );
      setTimeEntries(entriesData || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTimerStopped = async (entryData) => {
    await createTimeEntry(entryData);
    await fetchDashboardData();
  };

  const handleManualSave = async (entryData) => {
    await createTimeEntry(entryData);
    await fetchDashboardData();
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm("Are you sure you want to delete this time entry?")) {
      try {
        await deleteTimeEntry(entryId);
        await fetchDashboardData();
      } catch (err) {
        setError("Failed to delete time entry.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
              TimeTracker Pro
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-1 border border-gray-200 dark:border-gray-700"
              title="Toggle Dark Mode"
            >
              <span>{darkMode ? "🌙 Dark" : "☀️ Light"}</span>
            </button>

            {/* Manage Projects Button */}
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(true)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold text-xs rounded-lg transition-colors border border-gray-200 dark:border-gray-600 flex items-center gap-1"
            >
              <span>📂</span> Manage Projects
            </button>

            {/* Add Manual Time Button */}
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow transition-colors flex items-center gap-1"
            >
              <span>+</span> Add Manual Time
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 1: Active Timer */}
        <TimerControl
          projects={projects}
          onTimerStopped={handleTimerStopped}
          onOpenProjectModal={() => setIsProjectModalOpen(true)}
        />

        {/* Section 2: Daily Summary */}
        <DailySummary dailySummary={dailySummary} />

        {/* Section 3: Time Entry Log */}
        <TimeLogList
          entries={timeEntries}
          onDeleteEntry={handleDeleteEntry}
          isLoading={isLoading}
        />
      </main>

      {/* Project Management Modal */}
      <ProjectManagementModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        onProjectsUpdated={fetchDashboardData}
      />

      {/* Manual Time Entry Modal */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleManualSave}
        projects={projects}
      />
    </div>
  );
}
