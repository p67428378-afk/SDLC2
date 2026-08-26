import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Lock,
  Calendar,
} from "lucide-react";

export default function WeeklyTimesheetTable({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  entries = [],
  loading = false,
  onOpenNewEntryModal,
  onEditEntry,
  onDeleteEntry,
}) {
  // Format dates for display
  const getWeekRangeLabel = (dateObj) => {
    const d = new Date(dateObj);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMon));
    const sunday = new Date(d.setDate(monday.getDate() + 6));

    const options = { month: "short", day: "numeric", year: "numeric" };
    return `${monday.toLocaleDateString(undefined, options)} - ${sunday.toLocaleDateString(undefined, options)}`;
  };

  const totalHours = entries.reduce(
    (sum, e) => sum + (parseFloat(e.hours_worked) || 0),
    0,
  );
  const pendingHours = entries
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + (parseFloat(e.hours_worked) || 0), 0);
  const approvedHours = entries
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + (parseFloat(e.hours_worked) || 0), 0);
  const rejectedHours = entries
    .filter((e) => e.status === "rejected")
    .reduce((sum, e) => sum + (parseFloat(e.hours_worked) || 0), 0);

  const getStatusBadge = (status, rejectionReason) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
              Rejected
            </span>
            {rejectionReason && (
              <span className="text-[11px] text-red-600 mt-0.5 font-normal italic">
                Reason: {rejectionReason}
              </span>
            )}
          </div>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3.5 h-3.5 mr-1 text-yellow-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header / Week Navigation */}
      <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Weekly Timesheet View
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Log, update, or view daily project work hours
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={onPrevWeek}
              className="p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-white transition"
              title="Previous Week"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-md transition"
            >
              Current Week
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              className="p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-white transition"
              title="Next Week"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
            {getWeekRangeLabel(currentDate)}
          </span>

          <button
            type="button"
            onClick={onOpenNewEntryModal}
            className="inline-flex items-center px-3.5 py-1.5 border border-transparent rounded-lg shadow-sm text-xs font-medium text-white bg-primary hover:bg-primary-dark transition"
          >
            <Plus className="w-4 h-4 mr-1" />
            Log Hours
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200 text-xs">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <span className="text-gray-500 block">Total Hours</span>
          <span className="text-lg font-bold text-gray-900">
            {totalHours.toFixed(1)} hrs
          </span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <span className="text-gray-500 block">Approved</span>
          <span className="text-lg font-bold text-green-600">
            {approvedHours.toFixed(1)} hrs
          </span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <span className="text-gray-500 block">Pending</span>
          <span className="text-lg font-bold text-yellow-600">
            {pendingHours.toFixed(1)} hrs
          </span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <span className="text-gray-500 block">Rejected</span>
          <span className="text-lg font-bold text-red-600">
            {rejectedHours.toFixed(1)} hrs
          </span>
        </div>
      </div>

      {/* Timesheet Entries Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
          <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
            <tr>
              <th scope="col" className="px-4 py-3">
                Date
              </th>
              <th scope="col" className="px-4 py-3">
                Project
              </th>
              <th scope="col" className="px-4 py-3">
                Hours
              </th>
              <th scope="col" className="px-4 py-3">
                Description
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 text-gray-800">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  Loading timesheet entries...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Clock className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="font-medium">
                      No hours logged for this week.
                    </p>
                    <p className="text-gray-400 mt-1">
                      Click "Log Hours" above to record work hours against a
                      project.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isPending = entry.status === "pending";
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {entry.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                        {entry.project?.name ||
                          "Project ID: " + entry.project_id.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">
                      {parseFloat(entry.hours_worked).toFixed(1)} hrs
                    </td>
                    <td
                      className="px-4 py-3 max-w-xs truncate text-gray-600"
                      title={entry.description}
                    >
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(entry.status, entry.rejection_reason)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditEntry(entry)}
                            className="inline-flex items-center p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                            title="Edit entry"
                            aria-label={`Edit entry ${entry.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry.id)}
                            className="inline-flex items-center p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                            title="Delete entry"
                            aria-label={`Delete entry ${entry.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center text-gray-400 text-xs italic">
                          <Lock className="w-3.5 h-3.5 mr-1" />
                          Locked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
