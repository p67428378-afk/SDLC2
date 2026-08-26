import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import WeeklyTimesheetTable from "../components/WeeklyTimesheetTable";
import TimeEntryForm from "../components/TimeEntryForm";
import { timesheetsApi } from "../services/api";
import { AlertCircle } from "lucide-react";

export default function EmployeeDashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState(null);

  // Calculate Monday and Sunday of the current week
  const getWeekBoundaries = (dateObj) => {
    const d = new Date(dateObj);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMon));
    const sunday = new Date(d.setDate(monday.getDate() + 6));

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dStr = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${dStr}`;
    };

    return {
      startDate: formatDate(monday),
      endDate: formatDate(sunday),
    };
  };

  const loadTimesheets = useCallback(async () => {
    setLoading(true);
    setPageError("");
    const { startDate, endDate } = getWeekBoundaries(currentDate);

    try {
      const data = await timesheetsApi.listTimesheets({
        start_date: startDate,
        end_date: endDate,
      });
      setEntries(data);
    } catch (err) {
      console.error("Failed to load timesheets:", err);
      setPageError(
        err.response?.data?.detail || "Failed to fetch weekly timesheets.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets]);

  const handlePrevWeek = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenNewEntry = () => {
    setSelectedEntryForEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry) => {
    setSelectedEntryForEdit(entry);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this pending timesheet entry?",
      )
    ) {
      try {
        await timesheetsApi.deleteTimesheet(id);
        await loadTimesheets();
      } catch (err) {
        alert(
          err.response?.data?.detail || err.message || "Failed to delete entry",
        );
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    if (selectedEntryForEdit) {
      await timesheetsApi.updateTimesheet(selectedEntryForEdit.id, formData);
    } else {
      await timesheetsApi.createTimesheet(formData);
    }
    await loadTimesheets();
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

        <WeeklyTimesheetTable
          currentDate={currentDate}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          entries={entries}
          loading={loading}
          onOpenNewEntryModal={handleOpenNewEntry}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      </main>

      <TimeEntryForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialEntry={selectedEntryForEdit}
        defaultDate={new Date().toISOString().split("T")[0]}
      />
    </div>
  );
}
