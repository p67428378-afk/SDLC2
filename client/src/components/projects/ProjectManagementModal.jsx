import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import ProjectForm from "./ProjectForm";
import ProjectTable from "./ProjectTable";
import AlertBanner from "../AlertBanner";
import {
  createProject,
  updateProject,
  deleteProject,
} from "../../services/api";

export default function ProjectManagementModal({
  isOpen,
  onClose,
  projects = [],
  onProjectsUpdated,
  isLoading,
}) {
  const [editingProject, setEditingProject] = useState(null);
  const [errorBanner, setErrorBanner] = useState("");
  const [successBanner, setSuccessBanner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateOrUpdate = async (formData) => {
    setIsSubmitting(true);
    setErrorBanner("");
    setSuccessBanner("");

    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData);
        setSuccessBanner(`Project '${formData.name}' updated successfully.`);
      } else {
        await createProject(formData);
        setSuccessBanner(`Project '${formData.name}' created successfully.`);
      }

      setEditingProject(null);
      if (onProjectsUpdated) {
        onProjectsUpdated();
      }
    } catch (err) {
      console.error("Error saving project:", err);
      const detail = err.response?.data?.detail || "Failed to save project.";
      setErrorBanner(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId, projectName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete project '${projectName}'?`,
      )
    ) {
      return;
    }

    setErrorBanner("");
    setSuccessBanner("");

    try {
      await deleteProject(projectId);
      setSuccessBanner(`Project '${projectName}' deleted successfully.`);
      if (editingProject?.id === projectId) {
        setEditingProject(null);
      }
      if (onProjectsUpdated) {
        onProjectsUpdated();
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      const detail =
        err.response?.data?.detail || `Cannot delete project '${projectName}'.`;
      setErrorBanner(detail);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2.5">
            <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Project Management (CRUD)
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

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <AlertBanner
            type="error"
            message={errorBanner}
            onClose={() => setErrorBanner("")}
          />
          <AlertBanner
            type="success"
            message={successBanner}
            onClose={() => setSuccessBanner("")}
          />

          <ProjectForm
            projectToEdit={editingProject}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => setEditingProject(null)}
            isSubmitting={isSubmitting}
          />

          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Existing Projects ({projects.length})
            </h3>
            <ProjectTable
              projects={projects}
              onEdit={(proj) => {
                setEditingProject(proj);
                setErrorBanner("");
                setSuccessBanner("");
              }}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
