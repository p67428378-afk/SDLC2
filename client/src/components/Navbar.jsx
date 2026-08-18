import React from "react";
import { Sun, Moon, FolderPlus, PlusCircle } from "lucide-react";

export default function Navbar({
  darkMode,
  toggleDarkMode,
  onOpenProjectsModal,
  onOpenManualModal,
}) {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label="timer">
            ⏱️
          </span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            TimeTracker{" "}
            <span className="text-blue-600 dark:text-blue-400">Pro</span>
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenManualModal}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-600"
            title="Add Manual Time"
          >
            <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Add Manual Time</span>
          </button>

          <button
            onClick={onOpenProjectsModal}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-600"
            title="Manage Projects"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Projects</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-600"
            aria-label="Toggle theme"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
