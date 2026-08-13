import React, { useState } from "react";

export default function ManualEntryModal({ isOpen, onClose, onSave }) {
  const [description, setDescription] = useState("");
  const [durationString, setDurationString] = useState("");
  const [loggedDate, setLoggedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!durationString.trim()) {
      setError("Duration is required.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        type: "manual",
        description: description.trim() || "Manual Entry",
        duration_string: durationString.trim(),
        logged_date: loggedDate,
      });
      setDescription("");
      setDurationString("");
      setLoggedDate(new Date().toISOString().split("T")[0]);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to save manual entry. Please check the duration format (e.g., "1h 30m", "45m").',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-md border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-on-surface">
            Add Manual Time
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-md space-y-4">
          <div>
            <label className="block font-label-sm text-on-surface-variant mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block font-label-sm text-on-surface-variant mb-1">
              Duration (e.g., "1h 30m", "45m", "1.5h")
            </label>
            <input
              type="text"
              placeholder="e.g., 1h 30m"
              value={durationString}
              onChange={(e) => setDurationString(e.target.value)}
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block font-label-sm text-on-surface-variant mb-1">
              Date
            </label>
            <input
              type="date"
              value={loggedDate}
              onChange={(e) => setLoggedDate(e.target.value)}
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:bg-primary-fixed text-on-primary-fixed font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
