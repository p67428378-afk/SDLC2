import React, { useState, useEffect } from "react";

const DEFAULT_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#06B6D4", // Cyan
];

export default function ProjectForm({
  projectToEdit = null,
  onSave,
  onCancel,
  isLoading = false,
  error = "",
}) {
  const [name, setName] = useState("");
  const [colorCode, setColorCode] = useState("#3B82F6");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || "");
      setColorCode(projectToEdit.color_code || "#3B82F6");
    } else {
      setName("");
      setColorCode("#3B82F6");
    }
  }, [projectToEdit]);

  const validateHex = (color) => /^#[0-9A-Fa-f]{6}$/.test(color);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Project name is required.");
      return;
    }

    if (!validateHex(colorCode)) {
      setFormError("Color code must be a valid hex format like #3B82F6.");
      return;
    }

    onSave({ name: name.trim(), color_code: colorCode.toUpperCase() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(formError || error) && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg font-medium">
          {formError || error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Website Redesign"
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Color Code (Hex #RRGGBB) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={colorCode}
            onChange={(e) => setColorCode(e.target.value)}
            className="w-9 h-9 p-0 border border-gray-300 dark:border-gray-600 rounded cursor-pointer shrink-0"
          />
          <input
            type="text"
            value={colorCode}
            onChange={(e) => setColorCode(e.target.value)}
            placeholder="#3B82F6"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Color Presets */}
        <div className="flex flex-wrap gap-2 pt-1">
          {DEFAULT_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColorCode(preset)}
              className={`w-6 h-6 rounded-full border transition-transform ${
                colorCode.toUpperCase() === preset.toUpperCase()
                  ? "scale-110 ring-2 ring-blue-500 border-white"
                  : "border-black/10 hover:scale-105"
              }`}
              style={{ backgroundColor: preset }}
              title={preset}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow transition-colors"
        >
          {isLoading
            ? "Saving..."
            : projectToEdit
              ? "Update Project"
              : "Create Project"}
        </button>
      </div>
    </form>
  );
}
