import React, { useState, useEffect, useCallback } from "react";
import { timesheetsAPI, projectsAPI } from "../services/api";
import {
  CheckSquare,
  XSquare,
  CheckCircle,
  XCircle,
  Clock,
  FolderGit2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Filter,
  BarChart3,
  Layers,
  Users,
} from "lucide-react";

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("timesheets"); // 'timesheets' | 'projects' | 'summary'

  // Timesheets state
  const [timesheets, setTimesheets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending"); // default to pending for manager review
  const [projectFilter, setProjectFilter] = useState("");

  // Projects state
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectActive, setNewProjectActive] = useState(true);
  const [editingProject, setEditingProject] = useState(null);

  // Summary state
  const [summaryData, setSummaryData] = useState(null);
  const [summaryTimeframe, setSummaryTimeframe] = useState("weekly");

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [timesheetList, projectList, summary] = await Promise.all([
        timesheetsAPI.listTimesheets({
          status: statusFilter || undefined,
          project_id: projectFilter || undefined,
          limit: 200,
        }),
        projectsAPI.listProjects({ include_inactive: true }),
        timesheetsAPI
          .getSummary({ timeframe: summaryTimeframe })
          .catch(() => null),
      ]);

      setTimesheets(timesheetList || []);
      setProjects(projectList || []);
      setSummaryData(summary);
      setSelectedIds([]);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to fetch manager data";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, projectFilter, summaryTimeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timesheet Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pendingIds = timesheets
        .filter((t) => t.status === "pending")
        .map((t) => t.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSingleApprove = async (id, status) => {
    setActionLoading(true);
    setError(null);
    try {
      await timesheetsAPI.approveTimesheet(id, status);
      setSuccessNotice(`Timesheet entry marked as ${status}.`);
      setTimeout(() => setSuccessNotice(""), 3000);
      await loadData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || `Failed to update status`;
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    setError(null);
    try {
      await timesheetsAPI.bulkApproveTimesheets(selectedIds, status);
      setSuccessNotice(
        `Successfully updated ${selectedIds.length} entries to ${status}.`,
      );
      setTimeout(() => setSuccessNotice(""), 3000);
      await loadData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Bulk operation failed";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // Project CRUD Actions
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      await projectsAPI.createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        active_status: newProjectActive,
      });
      setNewProjectName("");
      setNewProjectDesc("");
      setNewProjectActive(true);
      setSuccessNotice("Project created successfully.");
      setTimeout(() => setSuccessNotice(""), 3000);
      await loadData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to create project";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;
    setActionLoading(true);
    setError(null);
    try {
      await projectsAPI.updateProject(editingProject.id, {
        name: editingProject.name,
        description: editingProject.description,
        active_status: editingProject.active_status,
      });
      setEditingProject(null);
      setSuccessNotice("Project updated successfully.");
      setTimeout(() => setSuccessNotice(""), 3000);
      await loadData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to update project";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleProjectStatus = async (project) => {
    setActionLoading(true);
    setError(null);
    try {
      await projectsAPI.updateProject(project.id, {
        active_status: !project.active_status,
      });
      setSuccessNotice(`Project "${project.name}" status changed.`);
      setTimeout(() => setSuccessNotice(""), 3000);
      await loadData();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to change project status";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = timesheets.filter((t) => t.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#e3e8f0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171c29] tracking-tight">
            Manager Portal
          </h1>
          <p className="text-sm text-[#707a8c] mt-1">
            Review timesheet submissions, manage organization projects, and
            audit logged hours
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#e3e8f0] p-1 bg-white shadow-sm">
            <button
              onClick={() => setActiveTab("timesheets")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === "timesheets"
                  ? "bg-[#2663eb] text-white"
                  : "text-[#707a8c] hover:text-[#171c29]"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Timesheet Approvals</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === "projects"
                  ? "bg-[#2663eb] text-white"
                  : "text-[#707a8c] hover:text-[#171c29]"
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Projects</span>
            </button>

            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === "summary"
                  ? "bg-[#2663eb] text-white"
                  : "text-[#707a8c] hover:text-[#171c29]"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Hours Summary</span>
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading || actionLoading}
            className="p-2 rounded-lg bg-white border border-[#e3e8f0] text-[#171c29] hover:bg-gray-50 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200"
        >
          {error}
        </div>
      )}

      {successNotice && (
        <div
          role="status"
          className="p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* TAB 1: TIMESHEET APPROVALS */}
      {activeTab === "timesheets" && (
        <div className="space-y-6">
          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#e3e8f0] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#707a8c]" />
                <span className="text-xs font-bold text-[#707a8c] uppercase">
                  Filter Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-semibold bg-gray-50 border border-[#e3e8f0] rounded-lg px-2.5 py-1.5 focus:border-[#2663eb] outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending Review Only</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="text-xs font-semibold bg-gray-50 border border-[#e3e8f0] rounded-lg px-2.5 py-1.5 focus:border-[#2663eb] outline-none"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={selectedIds.length === 0 || actionLoading}
                onClick={() => handleBulkAction("approved")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-40"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Bulk Approve ({selectedIds.length})</span>
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0 || actionLoading}
                onClick={() => handleBulkAction("rejected")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-40"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Bulk Reject ({selectedIds.length})</span>
              </button>
            </div>
          </div>

          {/* Timesheets Table */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e3e8f0] overflow-hidden">
            <div className="p-4 border-b border-[#e3e8f0] flex items-center justify-between">
              <h2 className="text-base font-bold text-[#171c29]">
                Timesheet Submissions ({timesheets.length})
              </h2>
              <span className="text-xs text-[#707a8c]">
                {selectedIds.length} item(s) selected
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#f7fafc] border-b border-[#e3e8f0]">
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          timesheets.filter((t) => t.status === "pending")
                            .length > 0 &&
                          selectedIds.length ===
                            timesheets.filter((t) => t.status === "pending")
                              .length
                        }
                        onChange={handleSelectAll}
                        className="rounded text-[#2663eb] focus:ring-[#2663eb]"
                      />
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-[#707a8c] uppercase">
                      Employee
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-[#707a8c] uppercase">
                      Project
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-[#707a8c] uppercase">
                      Date
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-[#707a8c] uppercase text-right">
                      Hours
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-[#707a8c] uppercase">
                      Description
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-[#707a8c] uppercase">
                      Status
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-[#707a8c] uppercase text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8f0]">
                  {timesheets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 text-center text-sm text-[#707a8c]"
                      >
                        No timesheet entries found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    timesheets.map((entry) => {
                      const isSelected = selectedIds.includes(entry.id);
                      return (
                        <tr
                          key={entry.id}
                          className={`hover:bg-gray-50/70 transition-colors ${
                            isSelected ? "bg-blue-50/40" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            {entry.status === "pending" ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectOne(entry.id)}
                                className="rounded text-[#2663eb] focus:ring-[#2663eb]"
                              />
                            ) : (
                              <span className="text-gray-300">•</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-xs text-[#171c29]">
                            {entry.user?.email ||
                              `User ${entry.user_id?.substring(0, 8)}`}
                          </td>
                          <td className="py-3 px-4 text-xs text-[#171c29]">
                            {entry.project?.name ||
                              `Project ${entry.project_id?.substring(0, 8)}`}
                          </td>
                          <td className="py-3 px-4 text-xs text-[#707a8c]">
                            {entry.date}
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-[#171c29] text-right">
                            {Number(entry.hours_worked).toFixed(1)}h
                          </td>
                          <td
                            className="py-3 px-4 text-xs text-[#707a8c] max-w-[220px] truncate"
                            title={entry.description || ""}
                          >
                            {entry.description || (
                              <span className="italic text-gray-400">
                                No notes
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                                entry.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : entry.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {entry.status === "approved" && (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {entry.status === "rejected" && (
                                <XCircle className="w-3 h-3" />
                              )}
                              {entry.status === "pending" && (
                                <Clock className="w-3 h-3" />
                              )}
                              <span className="capitalize">{entry.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {entry.status === "pending" ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSingleApprove(entry.id, "approved")
                                  }
                                  disabled={actionLoading}
                                  className="p-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                                  title="Approve"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSingleApprove(entry.id, "rejected")
                                  }
                                  disabled={actionLoading}
                                  className="p-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                                  title="Reject"
                                >
                                  <XSquare className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Resolved
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
        </div>
      )}

      {/* TAB 2: PROJECT MANAGEMENT */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Project Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-[#e3e8f0] shadow-sm">
            <h2 className="text-base font-bold text-[#171c29] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#2663eb]" />
              <span>Create New Project</span>
            </h2>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171c29] mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Phoenix Overhaul"
                  className="w-full text-sm border border-[#e3e8f0] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171c29] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Goals, client details, or scope..."
                  className="w-full text-sm border border-[#e3e8f0] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active_status"
                  checked={newProjectActive}
                  onChange={(e) => setNewProjectActive(e.target.checked)}
                  className="rounded text-[#2663eb] focus:ring-[#2663eb]"
                />
                <label
                  htmlFor="active_status"
                  className="text-xs font-medium text-[#171c29]"
                >
                  Active for Employee Timesheet Logging
                </label>
              </div>

              <button
                type="submit"
                disabled={actionLoading || !newProjectName.trim()}
                className="w-full py-2 px-4 bg-[#2663eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>

          {/* Configured Projects List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#e3e8f0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#e3e8f0] flex items-center justify-between">
              <h2 className="text-base font-bold text-[#171c29] flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#2663eb]" />
                <span>Configured Projects ({projects.length})</span>
              </h2>
            </div>

            <div className="divide-y divide-[#e3e8f0]">
              {projects.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#707a8c]">
                  No projects configured yet. Use the form to create one.
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/60"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#171c29]">
                          {project.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            project.active_status
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {project.active_status ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-[#707a8c]">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setEditingProject(project)}
                        className="p-1.5 rounded-lg border border-[#e3e8f0] text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleProjectStatus(project)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                          project.active_status
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {project.active_status ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#e3e8f0] w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#e3e8f0]">
              <h3 className="font-bold text-sm text-[#171c29]">Edit Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171c29] mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProject.name}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      name: e.target.value,
                    })
                  }
                  className="w-full text-sm border border-[#e3e8f0] rounded-lg px-3 py-2 outline-none focus:border-[#2663eb]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171c29] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingProject.description || ""}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      description: e.target.value,
                    })
                  }
                  className="w-full text-sm border border-[#e3e8f0] rounded-lg px-3 py-2 outline-none focus:border-[#2663eb]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_active"
                  checked={editingProject.active_status}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      active_status: e.target.checked,
                    })
                  }
                  className="rounded text-[#2663eb]"
                />
                <label
                  htmlFor="edit_active"
                  className="text-xs font-medium text-[#171c29]"
                >
                  Active Status
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e3e8f0]">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-[#e3e8f0] rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#2663eb] rounded-lg hover:bg-[#1d4ed8]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: HOURS SUMMARY AGGREGATION */}
      {activeTab === "summary" && (
        <div className="bg-white p-6 rounded-xl border border-[#e3e8f0] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#171c29]">
                Organization Hours Summary
              </h2>
              <p className="text-xs text-[#707a8c]">
                Aggregated logged hours across projects and team members
              </p>
            </div>

            <div className="flex rounded-lg border border-[#e3e8f0] p-1 bg-gray-50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSummaryTimeframe("weekly")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  summaryTimeframe === "weekly"
                    ? "bg-white shadow-sm text-[#2663eb]"
                    : "text-[#707a8c] hover:text-[#171c29]"
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setSummaryTimeframe("monthly")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  summaryTimeframe === "monthly"
                    ? "bg-white shadow-sm text-[#2663eb]"
                    : "text-[#707a8c] hover:text-[#171c29]"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {summaryData ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-900 uppercase">
                    Total Logged Time
                  </span>
                  <div className="text-2xl font-extrabold text-[#2663eb] mt-0.5">
                    {Number(summaryData.total_hours || 0).toFixed(1)} Hours
                  </div>
                </div>
                <div className="text-xs text-[#707a8c]">
                  Timeframe:{" "}
                  <span className="font-semibold capitalize text-[#171c29]">
                    {summaryData.timeframe}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryData.items && summaryData.items.length > 0 ? (
                  summaryData.items.map((item) => (
                    <div
                      key={item.project_id}
                      className="p-4 bg-[#f7fafc] rounded-lg border border-[#e3e8f0] flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm text-[#171c29]">
                          {item.project_name}
                        </span>
                        <span className="text-xs font-bold text-[#2663eb] bg-white px-2 py-0.5 rounded border border-blue-200 shadow-xs">
                          {Number(item.total_hours).toFixed(1)} hrs
                        </span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-[#707a8c]">
                        <span>Submissions:</span>
                        <span className="font-semibold text-[#171c29]">
                          {item.entry_count} entries
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#707a8c] col-span-full py-8 text-center">
                    No hours recorded for this aggregation period.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[#707a8c]">
              Loading summary data...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
