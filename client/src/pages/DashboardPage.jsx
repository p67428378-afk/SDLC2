import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import TimerControl from "../components/timer/TimerControl";
import DailySummary from "../components/summary/DailySummary";
import TimeLogList from "../components/summary/TimeLogList";
import ProjectManagementModal from "../components/projects/ProjectManagementModal";
import ManualEntryModal from "../components/manual/ManualEntryModal";
import AlertBanner from "../components/AlertBanner";
import {
  getProjects,
  getDailySummary,
  getTimeEntries,
  deleteTimeEntry,
} from "../services/api";

export default function DashboardPage({ darkMode, toggleDarkMode }) {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [projects, setProjects] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);

  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingSummary, setIsLoadingLoadingSummary] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  const [globalError, setGlobalError] = useState("");

  // Fetch Projects list
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const data = await getProjects();
      setProjects(data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setGlobalError("Failed to load projects list.");
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // Fetch Daily Summary for selected date
  const fetchSummary = useCallback(async (dateStr) => {
    setIsLoadingLoadingSummary(true);
    try {
      const data = await getDailySummary(dateStr);
      setSummaryData(data);
    } catch (err) {
      console.error("Error fetching summary:", err);
      setGlobalError("Failed to load daily summary.");
    } finally {
      setIsLoadingLoadingSummary(false);
    }
  }, []);

  // Fetch Time Entries for selected date
  const fetchEntries = useCallback(async (dateStr) => {
    setIsLoadingEntries(true);
    try {
      const data = await getTimeEntries(dateStr);
      setTimeEntries(data || []);
    } catch (err) {
      console.error("Error fetching time entries:", err);
      setGlobalError("Failed to load time entries.");
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  // Refresh all date-dependent data
  const refreshDateData = useCallback(() => {
    fetchSummary(selectedDate);
    fetchEntries(selectedDate);
  }, [selectedDate, fetchSummary, fetchEntries]);

  // Initial load & date change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    refreshDateData();
  }, [selectedDate, refreshDateData]);

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this time entry?"))
      return;
    try {
      await deleteTimeEntry(entryId);
      refreshDateData();
    } catch (err) {
      console.error("Error deleting time entry:", err);
      setGlobalError("Failed to delete time entry.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col">
      <Navbar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        onOpenManualModal={() => setIsManualModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AlertBanner
          type="error"
          message={globalError}
          onClose={() => setGlobalError("")}
        />

        {/* Active Timer Section */}
        <TimerControl
          projects={projects}
          onEntrySaved={refreshDateData}
          onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        />

        {/* Daily Summary Section */}
        <DailySummary
          summaryData={summaryData}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isLoading={isLoadingSummary}
        />

        {/* Detailed Time Logs Section */}
        <TimeLogList
          entries={timeEntries}
          onDeleteEntry={handleDeleteEntry}
          isLoading={isLoadingEntries}
        />
      </main>

      {/* Project Management Modal */}
      <ProjectManagementModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        onProjectsUpdated={() => {
          fetchProjects();
          refreshDateData();
        }}
        isLoading={isLoadingProjects}
      />

      {/* Manual Time Entry Modal */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        projects={projects}
        onEntrySaved={refreshDateData}
      />

      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        TimeTracker Pro &copy; {new Date().getFullYear()} &bull; Project Tagging
        &amp; Daily Summary Grouping
      </footer>
    </div>
  );
}
