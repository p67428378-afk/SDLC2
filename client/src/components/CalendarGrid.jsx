import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default function CalendarGrid({
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onTodayWeek,
  projects = [],
  entries = [],
  onSaveEntry,
  onDeleteEntry,
  isLoading = false,
}) {
  const [selectedCell, setSelectedCell] = useState(null); // { project, dateStr, existingEntry }
  const [hoursInput, setHoursInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate 7 days starting from currentWeekStart (Monday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return { dateObj: d, dateStr, dayName, dayNum };
  });

  // Helper to find entry for a project and date
  const getEntry = (projectId, dateStr) => {
    return entries.find(
      (e) => e.project_id === projectId && e.date === dateStr,
    );
  };

  // Calculate day total
  const getDayTotal = (dateStr) => {
    return entries
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + Number(e.hours_worked || 0), 0);
  };

  // Calculate project total
  const getProjectTotal = (projectId) => {
    const dates = weekDays.map((d) => d.dateStr);
    return entries
      .filter((e) => e.project_id === projectId && dates.includes(e.date))
      .reduce((sum, e) => sum + Number(e.hours_worked || 0), 0);
  };

  // Grand total
  const getWeekGrandTotal = () => {
    const dates = weekDays.map((d) => d.dateStr);
    return entries
      .filter((e) => dates.includes(e.date))
      .reduce((sum, e) => sum + Number(e.hours_worked || 0), 0);
  };

  const handleOpenModal = (project, dateStr) => {
    const existing = project ? getEntry(project.id, dateStr) : null;
    setSelectedCell({ project, dateStr, existingEntry: existing });
    setSelectedProjectId(project ? project.id : projects[0]?.id || "");
    setHoursInput(existing ? String(existing.hours_worked) : "");
    setDescriptionInput(existing?.description || "");
    setFormError("");
  };

  const handleCloseModal = () => {
    setSelectedCell(null);
    setHoursInput("");
    setDescriptionInput("");
    setSelectedProjectId("");
    setFormError("");
    setIsSubmitting(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setFormError("Hours worked must be between 0.1 and 24.0");
      return;
    }
    const projId = selectedProjectId || selectedCell?.project?.id;
    if (!projId) {
      setFormError("Please select a project");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await onSaveEntry({
        id: selectedCell?.existingEntry?.id,
        project_id: projId,
        date: selectedCell.dateStr,
        hours_worked: hours,
        description: descriptionInput.trim() || undefined,
      });
      handleCloseModal();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save timesheet entry";
      setFormError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this pending entry?"))
      return;
    try {
      await onDeleteEntry(entryId);
      handleCloseModal();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to delete entry");
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const formatWeekRange = () => {
    const start = weekDays[0].dateObj;
    const end = weekDays[6].dateObj;
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e3e8f0] overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="p-4 sm:p-6 border-b border-[#e3e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#171c29]">
            Weekly Hours Matrix
          </h2>
          <p className="text-sm text-[#707a8c]">{formatWeekRange()}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="p-2 rounded-lg border border-[#e3e8f0] hover:bg-gray-50 text-[#171c29] transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onTodayWeek}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#e3e8f0] hover:bg-gray-50 text-[#171c29] transition-colors"
          >
            Current Week
          </button>
          <button
            onClick={onNextWeek}
            className="p-2 rounded-lg border border-[#e3e8f0] hover:bg-gray-50 text-[#171c29] transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#f7fafc] border-b border-[#e3e8f0]">
              <th className="py-3 px-4 font-semibold text-xs text-[#707a8c] uppercase tracking-wider w-1/4">
                Active Project
              </th>
              {weekDays.map((d) => (
                <th
                  key={d.dateStr}
                  className="py-3 px-3 text-center font-semibold text-xs text-[#707a8c] uppercase tracking-wider"
                >
                  <div>{d.dayName}</div>
                  <div className="text-[11px] font-normal text-[#707a8c]">
                    {d.dayNum}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-center font-semibold text-xs text-[#2663eb] uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8f0]">
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-8 text-center text-sm text-[#707a8c]"
                >
                  No active projects assigned or found. Contact your manager to
                  create projects.
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const projectTotal = getProjectTotal(project.id);
                return (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50/75 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm text-[#171c29]">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-xs text-[#707a8c] truncate max-w-[200px]">
                          {project.description}
                        </div>
                      )}
                    </td>

                    {weekDays.map((d) => {
                      const entry = getEntry(project.id, d.dateStr);
                      return (
                        <td
                          key={d.dateStr}
                          className="py-2 px-2 text-center align-middle"
                        >
                          {entry ? (
                            <button
                              onClick={() =>
                                handleOpenModal(project, d.dateStr)
                              }
                              className={`w-full py-1.5 px-2 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                                entry.status === "approved"
                                  ? "bg-green-50/70 border-green-200 text-green-900 hover:bg-green-100"
                                  : entry.status === "rejected"
                                    ? "bg-red-50/70 border-red-200 text-red-900 hover:bg-red-100"
                                    : "bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100"
                              }`}
                              title={`${entry.hours_worked}h - ${entry.status}${
                                entry.description
                                  ? `: ${entry.description}`
                                  : ""
                              }`}
                            >
                              <span className="font-bold">
                                {entry.hours_worked}h
                              </span>
                              <span className="text-[10px] capitalize opacity-80">
                                {entry.status}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleOpenModal(project, d.dateStr)
                              }
                              className="w-full py-2 px-2 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:text-[#2663eb] hover:border-[#2663eb] hover:bg-blue-50/50 transition-all flex items-center justify-center text-xs"
                              title="Log hours"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-center font-bold text-sm text-[#171c29] bg-gray-50/50">
                      {projectTotal.toFixed(1)}h
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-[#f7fafc] font-bold border-t-2 border-[#e3e8f0]">
              <td className="py-3 px-4 text-sm text-[#171c29]">Daily Total</td>
              {weekDays.map((d) => {
                const dayTotal = getDayTotal(d.dateStr);
                return (
                  <td
                    key={`total-${d.dateStr}`}
                    className={`py-3 px-3 text-center text-sm ${
                      dayTotal > 8 ? "text-amber-600" : "text-[#171c29]"
                    }`}
                  >
                    {dayTotal.toFixed(1)}h
                  </td>
                );
              })}
              <td className="py-3 px-4 text-center text-sm text-[#2663eb] bg-blue-50/40">
                {getWeekGrandTotal().toFixed(1)}h
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Log / Edit Hours Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#e3e8f0] w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#e3e8f0]">
              <h3 className="font-bold text-base text-[#171c29]">
                {selectedCell.existingEntry
                  ? "Edit Timesheet Entry"
                  : "Log Hours Worked"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="mt-4 space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200"
                >
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#171c29] mb-1">
                  Project
                </label>
                {selectedCell.existingEntry ? (
                  <input
                    type="text"
                    disabled
                    value={
                      projects.find(
                        (p) => p.id === selectedCell.existingEntry.project_id,
                      )?.name || "Selected Project"
                    }
                    className="w-full text-sm bg-gray-100 border border-[#e3e8f0] rounded-lg px-3 py-2 text-gray-600"
                  />
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full text-sm bg-white border border-[#e3e8f0] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb] outline-none"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171c29] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  disabled
                  value={selectedCell.dateStr}
                  className="w-full text-sm bg-gray-100 border border-[#e3e8f0] rounded-lg px-3 py-2 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171c29] mb-1">
                  Hours Worked (0.1 - 24.0)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="24.0"
                  required
                  disabled={
                    selectedCell.existingEntry &&
                    selectedCell.existingEntry.status !== "pending"
                  }
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  placeholder="e.g. 8.0"
                  className="w-full text-sm bg-white border border-[#e3e8f0] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb] outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171c29] mb-1">
                  Work Description / Notes
                </label>
                <textarea
                  rows={3}
                  disabled={
                    selectedCell.existingEntry &&
                    selectedCell.existingEntry.status !== "pending"
                  }
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Implemented authentication and weekly calendar grid..."
                  className="w-full text-sm bg-white border border-[#e3e8f0] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb] outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {selectedCell.existingEntry && (
                <div className="flex items-center justify-between p-3 bg-[#f7fafc] rounded-lg border border-[#e3e8f0]">
                  <span className="text-xs font-medium text-[#707a8c]">
                    Status
                  </span>
                  {statusBadge(selectedCell.existingEntry.status)}
                </div>
              )}

              {selectedCell.existingEntry &&
                selectedCell.existingEntry.status !== "pending" && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    🔒 Entries in{" "}
                    <strong>{selectedCell.existingEntry.status}</strong> status
                    are locked and cannot be edited or deleted.
                  </p>
                )}

              <div className="flex items-center justify-between pt-4 border-t border-[#e3e8f0]">
                {selectedCell.existingEntry &&
                selectedCell.existingEntry.status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedCell.existingEntry.id)}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg border border-[#e3e8f0] transition-colors"
                  >
                    Cancel
                  </button>
                  {(!selectedCell.existingEntry ||
                    selectedCell.existingEntry.status === "pending") && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#2663eb] hover:bg-[#1d4ed8] rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Save Entry"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
