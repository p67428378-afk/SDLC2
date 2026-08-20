import React, { useState } from "react";
import ProjectForm from "./ProjectForm.jsx";
import ProjectTable from "./ProjectTable.jsx";
import {
  createProject,
  updateProject,
  deleteProject,
} from "../../services/api.js";

export default function ProjectManagementModal({
  isOpen = false,
  onClose,
  projects = [],
  onProjectsUpdated,
}) {
  const [activeTab, setActiveTab] = useState("list"); // "list" | "form"
  const [editingProject, setEditingProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleOpenCreateForm = () => {
    setEditingProject(null);
    setErrorMessage("");
    setSuccessMessage("");
    setActiveTab("form");
  };

  const handleOpenEditForm = (project) => {
    setEditingProject(project);
    setErrorMessage("");
    setSuccessMessage("");
    setActiveTab("form");
  };

  const handleSaveProject = async (formData) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData);
        setSuccessMessage(`Project "${formData.name}" updated successfully.`);
      } else {
        await createProject(formData);
        setSuccessMessage(`Project "${formData.name}" created successfully.`);
      }

      if (onProjectsUpdated) {
        await onProjectsUpdated();
      }

      setActiveTab("list");
      setEditingProject(null);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to save project. Ensure name is unique and hex color is valid.";
      setErrorMessage(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete project "${projectName}"?`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteProject(projectId);
      setSuccessMessage(`Project "${projectName}" deleted successfully.`);
      if (onProjectsUpdated) {
        await onProjectsUpdated();
      }
    } catch (err) {
      // AC7: Extract HTTP 400 rejection detail e.g. "Cannot delete project 'Website Redesign' because it has existing time entries linked to it."
      const detail =
        err?.response?.data?.detail ||
        `Cannot delete project '${projectName}' because it has existing time entries linked to it.`;
      setErrorMessage(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📂</span> Project Management (CRUD)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Alert Banners */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center justify-between font-medium">
              <span>⚠️ {errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="text-red-700 dark:text-red-300 hover:opacity-75 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs rounded-xl flex items-center justify-between font-medium">
              <span>✅ {successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                className="text-green-700 dark:text-green-300 hover:opacity-75 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === "list" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Active Projects ({projects.length})
                </span>
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow transition-colors flex items-center gap-1"
                >
                  + Add Project
                </button>
              </div>

              <ProjectTable
                projects={projects}
                onEditProject={handleOpenEditForm}
                onDeleteProject={handleDeleteProject}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {editingProject ? "Edit Project" : "Create New Project"}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ← Back to Projects List
                </button>
              </div>

              <ProjectForm
                projectToEdit={editingProject}
                onSave={handleSaveProject}
                onCancel={() => setActiveTab("list")}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold text-xs rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
