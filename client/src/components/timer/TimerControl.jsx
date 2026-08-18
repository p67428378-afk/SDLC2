import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import ProjectSelect from "./ProjectSelect";
import { createTimeEntry } from "../../services/api";

const TIMER_STORAGE_KEY = "timetracker_timer_state_v1";

export default function TimerControl({
  projects = [],
  onEntrySaved,
  onOpenProjectsModal,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedProjectId(parsed.selectedProjectId || "");
        setDescription(parsed.description || "");

        if (parsed.isRunning && parsed.startTime) {
          const now = Date.now();
          const additional = Math.floor((now - parsed.startTime) / 1000);
          setElapsedSeconds((parsed.elapsedSeconds || 0) + additional);
          setIsRunning(true);
        } else {
          setElapsedSeconds(parsed.elapsedSeconds || 0);
          setIsRunning(false);
        }
      }
    } catch (e) {
      console.error("Failed to restore timer state:", e);
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        isRunning,
        elapsedSeconds,
        selectedProjectId,
        description,
        startTime: isRunning ? startTimeRef.current || Date.now() : null,
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save timer state:", e);
    }
  }, [isRunning, elapsedSeconds, selectedProjectId, description]);

  // Interval ticker
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleStart = () => {
    if (!selectedProjectId) {
      setValidationError("Please select a project before starting the timer.");
      return;
    }
    setValidationError("");
    setError("");
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStopAndSave = async () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (!selectedProjectId) {
      setValidationError("Please select a project to save time entry.");
      return;
    }

    if (elapsedSeconds < 1) {
      setError("Timer duration must be at least 1 second.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setValidationError("");

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      await createTimeEntry({
        project_id: selectedProjectId,
        duration_seconds: elapsedSeconds,
        description: description.trim() || "Timer session",
        entry_date: todayStr,
      });

      // Clear timer state
      setElapsedSeconds(0);
      setDescription("");
      localStorage.removeItem(TIMER_STORAGE_KEY);

      if (onEntrySaved) {
        onEntrySaved();
      }
    } catch (err) {
      console.error("Error saving timer entry:", err);
      const detail = err.response?.data?.detail || "Failed to save time entry.";
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedSeconds(0);
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Active Timer
          </h2>
        </div>
        {projects.length === 0 && (
          <button
            onClick={onOpenProjectsModal}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Create your first project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Description Input */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Task Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Mandatory Project Select */}
        <div className="md:col-span-4">
          <ProjectSelect
            projects={projects}
            selectedProjectId={selectedProjectId}
            onChange={(id) => {
              setSelectedProjectId(id);
              setValidationError("");
            }}
            error={validationError}
            disabled={isRunning}
          />
        </div>

        {/* Timer Display & Controls */}
        <div className="md:col-span-4 flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 md:pt-0">
          <div className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-white min-w-[140px] text-center sm:text-right">
            {formatTime(elapsedSeconds)}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </button>
            )}

            {(isRunning || elapsedSeconds > 0) && (
              <button
                onClick={handleStopAndSave}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                title="Stop and Save Entry"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Save</span>
              </button>
            )}

            {elapsedSeconds > 0 && !isRunning && (
              <button
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}
    </div>
  );
}
