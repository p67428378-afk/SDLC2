import React from "react";
import { ChevronDown, Folder } from "lucide-react";

export default function ProjectSelect({
  projects = [],
  selectedProjectId,
  onChange,
  error,
  disabled = false,
  required = true,
  className = "",
}) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
        Project {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={selectedProjectId || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/60 border ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 dark:border-slate-600 focus:ring-blue-500"
          } rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="" disabled>
            -- Select a Project --
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {/* Color Badge / Icon indicator */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          {selectedProject ? (
            <span
              className="w-3.5 h-3.5 rounded-full ring-1 ring-slate-300 dark:ring-slate-600"
              style={{
                backgroundColor: selectedProject.color_code || "#6B7280",
              }}
            />
          ) : (
            <Folder className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
