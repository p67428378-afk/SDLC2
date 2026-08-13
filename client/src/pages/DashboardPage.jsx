import React, { useState, useEffect } from "react";
import TimerCard from "../components/dashboard/TimerCard.jsx";
import ActivityLogCard from "../components/dashboard/ActivityLogCard.jsx";
import DailyGoalProgressCard from "../components/dashboard/DailyGoalProgressCard.jsx";
import ManualEntryModal from "../components/dashboard/ManualEntryModal.jsx";
import {
  getTodaySummary,
  createTimeEntry,
  deleteTimeEntry,
  listTimeEntries,
} from "../services/api.js";

export default function DashboardPage() {
  const [entries, setEntries] = useState([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [weeklyTotalSeconds, setWeeklyTotalSeconds] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch today's summary
      const todayData = await getTodaySummary();
      setEntries(todayData.entries || []);
      setTotalSeconds(todayData.total_duration_seconds || 0);

      // Fetch all entries to calculate weekly total (or just list all)
      const allEntries = await listTimeEntries();
      // Calculate weekly total (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklySum = allEntries
        .filter((e) => new Date(e.logged_date) >= oneWeekAgo)
        .reduce((sum, e) => sum + e.duration_seconds, 0);
      setWeeklyTotalSeconds(weeklySum);
    } catch (err) {
      setError(
        "Failed to load time tracking data. Please ensure the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTimerStopped = async (entryData) => {
    await createTimeEntry(entryData);
    await fetchData();
  };

  const handleManualEntrySave = async (entryData) => {
    await createTimeEntry(entryData);
    await fetchData();
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteTimeEntry(entryId);
        await fetchData();
      } catch (err) {
        setError("Failed to delete entry.");
      }
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const manualEntriesCount = entries.filter((e) => e.type === "manual").length;
  const manualDurationSeconds = entries
    .filter((e) => e.type === "manual")
    .reduce((sum, e) => sum + e.duration_seconds, 0);

  return (
    <main className="flex-1 mt-16 p-margin-mobile md:p-margin-desktop space-y-gutter">
      {error && (
        <div className="bg-error-container text-on-error-container p-md rounded-xl border border-error/20 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-on-error-container hover:opacity-80"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Actions Row */}
      <div className="flex justify-end mb-lg">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-fixed text-on-primary-fixed font-label-md text-label-md py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Manual Time
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Total Logged */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col justify-between">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">
              Total Logged Today
            </p>
            <p className="font-display-lg text-display-lg text-on-surface">
              {formatDuration(totalSeconds)}
            </p>
          </div>
          <div className="mt-md">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
              <span>Goal Progress</span>
              <span>
                {Math.min(Math.round((totalSeconds / 28800) * 100), 100)}% of 8h
              </span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full shadow-[0_0_8px_rgba(78,222,163,0.5)] transition-all duration-500"
                style={{
                  width: `${Math.min((totalSeconds / 28800) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Active Timer */}
        <TimerCard onTimerStopped={handleTimerStopped} />

        {/* Manual Entries */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col justify-between">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">
              Manual Entries
            </p>
            <p className="font-headline-lg text-headline-lg text-on-surface">
              {manualEntriesCount}{" "}
              {manualEntriesCount === 1 ? "entry" : "entries"}
            </p>
          </div>
          <div className="mt-md flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">edit_note</span>
            <span className="font-label-md text-label-md">
              {formatDuration(manualDurationSeconds)} total
            </span>
          </div>
        </div>

        {/* Weekly Total */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col justify-between">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">
              Weekly Total
            </p>
            <p className="font-display-lg text-display-lg text-on-surface">
              {formatDuration(weeklyTotalSeconds)}
            </p>
          </div>
          <div className="mt-md">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Last 7 days
            </span>
          </div>
        </div>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Activity Log */}
        <ActivityLogCard entries={entries} onDeleteEntry={handleDeleteEntry} />

        {/* Goal Progress Widget */}
        <DailyGoalProgressCard totalSeconds={totalSeconds} entries={entries} />
      </div>

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleManualEntrySave}
      />
    </main>
  );
}
