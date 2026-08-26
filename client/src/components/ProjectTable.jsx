import React, { useState } from "react";
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
} from "lucide-react";

export default function ProjectTable({
  projects = [],
  loading = false,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activeStatus, setActiveStatus] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingProject(null);
    setName("");
    setDescription("");
    setActiveStatus(true);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (proj) => {
    setEditingProject(proj);
    setName(proj.name || "");
    setDescription(proj.description || "");
    setActiveStatus(proj.active_status !== false);
    setFormError("");
    setModalOpen(true);
  };

  const handleToggleStatus = async (proj) => {
    try {
      await onUpdateProject(proj.id, {
        active_status: !proj.active_status,
      });
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update project status",
      );
    }
  };

  const handleDelete = async (projId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await onDeleteProject(projId);
      } catch (err) {
        alert(
          err.response?.data?.detail ||
            err.message ||
            "Failed to delete project",
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Project name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingProject) {
        await onUpdateProject(editingProject.id, {
          name: name.trim(),
          description: description.trim() || null,
          active_status: activeStatus,
        });
      } else {
        await onCreateProject({
          name: name.trim(),
          description: description.trim() || null,
          active_status: activeStatus,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(
        err.response?.data?.detail || err.message || "Failed to save project",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <FolderKanban className="w-5 h-5 mr-2 text-primary" />
            Project Catalog
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage company projects, set active status, and govern time-tracking
            eligibility
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center px-3.5 py-1.5 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-primary hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Project
        </button>
      </div>

      {/* Projects Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
          <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
            <tr>
              <th scope="col" className="px-4 py-3">
                Project Name
              </th>
              <th scope="col" className="px-4 py-3">
                Description
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Created Date
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 text-gray-800">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  Loading projects...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <FolderKanban className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="font-medium">No projects found.</p>
                    <p className="text-gray-400 mt-1">
                      Click "New Project" to create your first active project.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">
                    {proj.name}
                  </td>
                  <td
                    className="px-4 py-3 max-w-sm truncate text-gray-600"
                    title={proj.description || ""}
                  >
                    {proj.description || (
                      <span className="italic text-gray-400">
                        No description provided
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(proj)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${
                        proj.active_status
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Click to toggle active status"
                    >
                      {proj.active_status ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1 text-gray-500" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {proj.created_at
                      ? new Date(proj.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(proj)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                      title="Edit project"
                      aria-label={`Edit project ${proj.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(proj.id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                      title="Delete project"
                      aria-label={`Delete project ${proj.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Project Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-gray-900 text-sm">
                <FolderKanban className="w-5 h-5 text-primary" />
                <span>
                  {editingProject ? "Edit Project" : "Create New Project"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700"
                >
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label
                  className="block font-semibold text-gray-700 mb-1"
                  htmlFor="proj-name"
                >
                  Project Name *
                </label>
                <input
                  id="proj-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Project Alpha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label
                  className="block font-semibold text-gray-700 mb-1"
                  htmlFor="proj-desc"
                >
                  Description
                </label>
                <textarea
                  id="proj-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of project goals and scope..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="proj-active-status"
                  type="checkbox"
                  checked={activeStatus}
                  onChange={(e) => setActiveStatus(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label
                  htmlFor="proj-active-status"
                  className="font-medium text-gray-700 select-none"
                >
                  Active (Employees can select and log hours for this project)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark font-semibold text-white rounded-md transition"
                >
                  {saving
                    ? "Saving..."
                    : editingProject
                      ? "Update Project"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
