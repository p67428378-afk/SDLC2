import React, { useState } from "react";
import ProjectSelect from "../timer/ProjectSelect.jsx";

export function parseDurationInput(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.trim().toLowerCase();
  if (!s) return null;

  // Pure digits: treat as minutes if <= 1440, else seconds
  if (/^\d+$/.test(s)) {
    const num = parseInt(s, 10);
    if (num <= 0) return null;
    return num * 60; // default to minutes
  }

  // Hours and minutes pattern e.g. "1h 30m", "1h", "30m", "1.5h"
  let totalSeconds = 0;
  let matched = false;

  const hoursMatch = s.match(/(\d+(?:\.\d+)?)\s*h/);
  if (hoursMatch) {
    totalSeconds += parseFloat(hoursMatch[1]) * 3600;
    matched = true;
  }

  const minsMatch = s.match(/(\d+(?:\.\d+)?)\s*m/);
  if (minsMatch) {
    totalSeconds += parseFloat(minsMatch[1]) * 60;
    matched = true;
  }

  const secsMatch = s.match(/(\d+(?:\.\d+)?)\s*s/);
  if (secsMatch) {
    totalSeconds += parseFloat(secsMatch[1]);
    matched = true;
  }

  if (matched && totalSeconds > 0) {
    return Math.round(totalSeconds);
  }

  return null;
}

export default function ManualEntryModal({
  isOpen = false,
  onClose,
  onSave,
  projects = [],
}) {
  const [projectId, setProjectId] = useState("");
  const [durationStr, setDurationStr] = useState("1h 0m");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!projectId) {
      setError("Please select a project for the manual time entry.");
      return;
    }

    const durationSeconds = parseDurationInput(durationStr);
    if (!durationSeconds || durationSeconds <= 0) {
      setError(
        'Invalid duration format. Please enter formats like "1h 30m", "90m", or "1.5h".',
      );
      return;
    }

    if (!entryDate) {
      setError("Please select an entry date.");
      return;
    }

    const payload = {
      project_id: projectId,
      description: description.trim() || "Manual time entry",
      duration_seconds: durationSeconds,
      entry_date: entryDate,
      type: "manual",
    };

    setIsLoading(true);
    try {
      if (onSave) {
        await onSave(payload);
      }
      // Reset form
      setProjectId("");
      setDurationStr("1h 0m");
      setDescription("");
      setError("");
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to save manual time entry.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>⏱️</span> Add Manual Time Entry
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Project Selector */}
          <ProjectSelect
            projects={projects}
            selectedProjectId={projectId}
            onChange={(val) => {
              setProjectId(val);
              if (val) setError("");
            }}
            error={!projectId && error ? error : ""}
            required={true}
          />

          {/* Duration Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Duration <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={durationStr}
              onChange={(e) => setDurationStr(e.target.value)}
              placeholder="e.g. 1h 30m, 90m, 2h"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
              Accepts formats like "1h 30m", "90m", "1.5h".
            </span>
          </div>

          {/* Entry Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Team meeting"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow transition-colors"
            >
              {isLoading ? "Saving..." : "Save Time Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
