import React, { useState, useEffect } from "react";
import { Plus, Check, Edit2 } from "lucide-react";

const COLOR_PRESETS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#6B7280", // Gray
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#06B6D4", // Cyan
];

export default function ProjectForm({
  projectToEdit,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const [name, setName] = useState("");
  const [colorCode, setColorCode] = useState("#3B82F6");
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || "");
      setColorCode(projectToEdit.color_code || "#3B82F6");
    } else {
      setName("");
      setColorCode("#3B82F6");
    }
    setError("");
  }, [projectToEdit]);

  const validateHex = (hex) => /^#[0-9A-Fa-f]{6}$/.test(hex);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    const trimmedColor = colorCode.trim();
    if (!validateHex(trimmedColor)) {
      setError("Color code must be a valid hex format (e.g. #3B82F6).");
      return;
    }

    onSubmit({ name: trimmedName, color_code: trimmedColor });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 mb-6"
    >
      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
        {projectToEdit ? (
          <Edit2 className="w-4 h-4 text-blue-500" />
        ) : (
          <Plus className="w-4 h-4 text-blue-500" />
        )}
        <span>{projectToEdit ? "Edit Project" : "Create New Project"}</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        {/* Project Name */}
        <div className="sm:col-span-6">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Website Redesign"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            required
          />
        </div>

        {/* Color Code */}
        <div className="sm:col-span-6">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Color Code (Hex) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={validateHex(colorCode) ? colorCode : "#3B82F6"}
              onChange={(e) => {
                setColorCode(e.target.value.toUpperCase());
                setError("");
              }}
              className="w-10 h-10 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 cursor-pointer flex-shrink-0"
              title="Pick a color"
            />
            <input
              type="text"
              value={colorCode}
              onChange={(e) => {
                setColorCode(e.target.value);
                setError("");
              }}
              placeholder="#3B82F6"
              maxLength={7}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
              required
            />
          </div>
        </div>

        {/* Color Presets */}
        <div className="sm:col-span-12">
          <span className="block text-xs font-medium text-slate-400 mb-1.5">
            Preset Palette:
          </span>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setColorCode(preset);
                  setError("");
                }}
                className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ring-2 ${
                  colorCode.toUpperCase() === preset.toUpperCase()
                    ? "scale-110 ring-blue-500 dark:ring-blue-400"
                    : "ring-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: preset }}
                title={preset}
              >
                {colorCode.toUpperCase() === preset.toUpperCase() && (
                  <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end space-x-3 mt-5">
        {projectToEdit && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : projectToEdit
              ? "Update Project"
              : "Save Project"}
        </button>
      </div>
    </form>
  );
}
