import React, { useState, useEffect } from "react";
import { X, Clock, PlusCircle } from "lucide-react";
import ProjectSelect from "../timer/ProjectSelect";
import AlertBanner from "../AlertBanner";
import { createTimeEntry } from "../../services/api";

export default function ManualEntryModal({
  isOpen,
  onClose,
  projects = [],
  onEntrySaved,
}) {
  const [projectId, setProjectId] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [projectError, setProjectError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProjectId("");
      setDurationInput("");
      setEntryDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setError("");
      setProjectError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Parse duration string into total seconds
  // Accepts: "1h 30m", "90m", "1.5h", "2h", "45s", "01:30:00", pure numbers as minutes or seconds
  const parseDurationToSeconds = (input) => {
    const text = input.trim().toLowerCase();
    if (!text) return null;

    // Check hh:mm:ss or hh:mm
    if (/^\d+:\d{2}(:\d{2})?$/.test(text)) {
      const parts = text.split(":").map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return parts[0] * 3600 + parts[1] * 60;
    }

    let totalSec = 0;
    let matched = false;

    // Match hours e.g. "1.5h" or "1h"
    const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
    if (hoursMatch) {
      totalSec += parseFloat(hoursMatch[1]) * 3600;
      matched = true;
    }

    // Match minutes e.g. "30m"
    const minsMatch = text.match(/(\d+(?:\.\d+)?)\s*m/);
    if (minsMatch) {
      totalSec += parseFloat(minsMatch[1]) * 60;
      matched = true;
    }

    // Match seconds e.g. "45s"
    const secsMatch = text.match(/(\d+)\s*s/);
    if (secsMatch) {
      totalSec += parseInt(secsMatch[1], 10);
      matched = true;
    }

    if (matched) return Math.round(totalSec);

    // If pure number e.g. "90" -> default to minutes
    if (/^\d+(\.\d+)?$/.test(text)) {
      return Math.round(parseFloat(text) * 60);
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setProjectError("");

    if (!projectId) {
      setProjectError("Project selection is mandatory.");
      return;
    }

    const durationSec = parseDurationToSeconds(durationInput);
    if (!durationSec || durationSec <= 0) {
      setError(
        'Invalid duration format. Examples: "1h 30m", "90m", "1.5h", "45".',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await createTimeEntry({
        project_id: projectId,
        duration_seconds: durationSec,
        description: description.trim() || "Manual time entry",
        entry_date: entryDate,
      });

      if (onEntrySaved) {
        onEntrySaved();
      }
      onClose();
    } catch (err) {
      console.error("Error submitting manual entry:", err);
      const detail =
        err.response?.data?.detail || "Failed to submit manual time entry.";
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2.5">
            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Add Manual Time Entry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <AlertBanner
            type="error"
            message={error}
            onClose={() => setError("")}
          />

          {/* Mandatory Project Select */}
          <ProjectSelect
            projects={projects}
            selectedProjectId={projectId}
            onChange={(id) => {
              setProjectId(id);
              setProjectError("");
            }}
            error={projectError}
            required
          />

          {/* Duration Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Duration <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={durationInput}
                onChange={(e) => {
                  setDurationInput(e.target.value);
                  setError("");
                }}
                placeholder="e.g. 1h 30m, 90m, or 1.5h"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Accepted formats: "1h 30m", "90m", "1.5h", "01:30:00"
            </p>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Team meeting, code review, bug fix"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Add Time Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
