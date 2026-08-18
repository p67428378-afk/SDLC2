import React from "react";
import { Edit, Trash2, Folder } from "lucide-react";

export default function ProjectTable({
  projects = [],
  onEdit,
  onDelete,
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        Loading projects...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400 dark:text-slate-500">
        <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No projects created yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Use the form above to add your first project.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <th className="py-3 px-3">Project</th>
            <th className="py-3 px-3">Color Code</th>
            <th className="py-3 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {projects.map((project) => (
            <tr
              key={project.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
            >
              <td className="py-3.5 px-3">
                <div className="flex items-center space-x-3">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-slate-800"
                    style={{ backgroundColor: project.color_code || "#6B7280" }}
                  />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {project.name}
                  </span>
                </div>
              </td>
              <td className="py-3.5 px-3">
                <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded-md uppercase">
                  {project.color_code}
                </span>
              </td>
              <td className="py-3.5 px-3 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onEdit(project)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                    title="Edit project"
                    aria-label={`Edit ${project.name}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(project.id, project.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Delete project"
                    aria-label={`Delete ${project.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
