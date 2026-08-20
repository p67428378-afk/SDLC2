import React from "react";

export default function ProjectSelect({
  projects = [],
  selectedProjectId = "",
  onChange,
  error = "",
  disabled = false,
  className = "",
  required = true,
}) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
        Project {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative flex items-center">
        {selectedProject && (
          <span
            className="absolute left-3 w-3 h-3 rounded-full border border-black/10 shrink-0"
            style={{ backgroundColor: selectedProject.color_code || "#3B82F6" }}
          />
        )}
        <select
          value={selectedProjectId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${
            selectedProject ? "pl-8 pr-3" : "px-3"
          } ${
            error
              ? "border-red-500 dark:border-red-400 focus:ring-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <option value="">-- Select a Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
