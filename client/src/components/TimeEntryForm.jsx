import React, { useState, useEffect } from "react";
import { X, Clock, AlertCircle } from "lucide-react";
import { projectsApi } from "../services/api";

export default function TimeEntryForm({
  isOpen,
  onClose,
  onSubmit,
  initialEntry = null,
  defaultDate = "",
}) {
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(
    defaultDate || new Date().toISOString().split("T")[0],
  );
  const [hoursWorked, setHoursWorked] = useState("8.0");
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadActiveProjects();
      if (initialEntry) {
        setProjectId(initialEntry.project_id || "");
        setDate(
          initialEntry.date ||
            defaultDate ||
            new Date().toISOString().split("T")[0],
        );
        setHoursWorked(String(initialEntry.hours_worked || "8.0"));
        setDescription(initialEntry.description || "");
      } else {
        setDate(defaultDate || new Date().toISOString().split("T")[0]);
        setHoursWorked("8.0");
        setDescription("");
      }
      setError("");
    }
  }, [isOpen, initialEntry, defaultDate]);

  const loadActiveProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await projectsApi.listProjects(true);
      setProjects(data);
      if (data.length > 0 && !initialEntry && !projectId) {
        setProjectId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Unable to load active projects. Please refresh.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const hours = parseFloat(hoursWorked);
    if (!projectId) {
      setError("Please select an active project.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    if (isNaN(hours) || hours < 0.1 || hours > 24) {
      setError("Hours worked must be between 0.1 and 24.0.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description of the work performed.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        project_id: projectId,
        date: date,
        hours_worked: hours,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save timesheet entry.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-900 font-bold">
            <Clock className="w-5 h-5 text-primary" />
            <span>
              {initialEntry ? "Edit Timesheet Entry" : "Log Daily Hours"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700"
            >
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              className="block font-semibold text-gray-700 mb-1"
              htmlFor="project-select"
            >
              Active Project *
            </label>
            <select
              id="project-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loadingProjects}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {projects.length === 0 ? (
                <option value="">No active projects available</option>
              ) : (
                projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}{" "}
                    {proj.description ? `— ${proj.description}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block font-semibold text-gray-700 mb-1"
                htmlFor="entry-date"
              >
                Date *
              </label>
              <input
                id="entry-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label
                className="block font-semibold text-gray-700 mb-1"
                htmlFor="hours-worked"
              >
                Hours Worked (0.1 - 24) *
              </label>
              <input
                id="hours-worked"
                type="number"
                step="0.25"
                min="0.1"
                max="24"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label
              className="block font-semibold text-gray-700 mb-1"
              htmlFor="entry-desc"
            >
              Task Description *
            </label>
            <textarea
              id="entry-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of activities and tasks completed..."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loadingProjects}
              className="px-4 py-2 border border-transparent rounded-md font-semibold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 transition"
            >
              {saving
                ? "Saving..."
                : initialEntry
                  ? "Update Entry"
                  : "Log Hours"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
