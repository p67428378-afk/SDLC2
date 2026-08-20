import React from "react";

export default function ProjectTable({
  projects = [],
  onEditProject,
  onDeleteProject,
  isLoading = false,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="py-2.5 px-3">Color</th>
            <th className="py-2.5 px-3">Project Name</th>
            <th className="py-2.5 px-3 font-mono">Hex Code</th>
            <th className="py-2.5 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
          {isLoading ? (
            <tr>
              <td
                colSpan="4"
                className="py-6 text-center text-gray-500 dark:text-gray-400"
              >
                Loading projects...
              </td>
            </tr>
          ) : projects.length === 0 ? (
            <tr>
              <td
                colSpan="4"
                className="py-6 text-center text-gray-500 dark:text-gray-400"
              >
                No projects created yet. Add one above!
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="py-3 px-3">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: project.color_code || "#3B82F6" }}
                  />
                </td>
                <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">
                  {project.name}
                </td>
                <td className="py-3 px-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                  {project.color_code}
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEditProject && (
                      <button
                        type="button"
                        onClick={() => onEditProject(project)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                      >
                        Edit
                      </button>
                    )}
                    {onDeleteProject && (
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteProject(project.id, project.name)
                        }
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
