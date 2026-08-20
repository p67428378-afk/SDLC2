import React, { useState, useEffect, useRef } from "react";
import ProjectSelect from "./ProjectSelect.jsx";

const STORAGE_KEY = "chronos_timer_state";

export default function TimerControl({
  projects = [],
  onTimerStopped,
  onOpenProjectModal,
}) {
  const [isRunning, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(null);

  const timerRef = useRef(null);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedProjectId(parsed.selectedProjectId || "");
        setDescription(parsed.description || "");
        setElapsedSeconds(parsed.elapsedSeconds || 0);
        setIsStarted(parsed.isRunning || false);
        setIsPaused(parsed.isPaused || false);
        setStartedAt(parsed.startedAt || null);

        // If timer was actively running when refreshed, adjust elapsedSeconds based on background timestamp
        if (parsed.isRunning && !parsed.isPaused && parsed.lastTimestamp) {
          const now = Date.now();
          const delta = Math.floor((now - parsed.lastTimestamp) / 1000);
          if (delta > 0) {
            setElapsedSeconds((prev) => (prev || 0) + delta);
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore timer state", e);
    }
  }, []);

  // Sync state to localStorage whenever changed
  useEffect(() => {
    try {
      const stateToSave = {
        isRunning,
        isPaused,
        elapsedSeconds,
        selectedProjectId,
        description,
        startedAt,
        lastTimestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save timer state", e);
    }
  }, [
    isRunning,
    isPaused,
    elapsedSeconds,
    selectedProjectId,
    description,
    startedAt,
  ]);

  // Interval timer ticks
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused]);

  const handleStart = () => {
    if (!selectedProjectId) {
      setError("Please select a project before starting the timer.");
      return;
    }
    setError("");
    if (!isRunning) {
      setIsStarted(true);
      setIsPaused(false);
      setStartedAt(new Date().toISOString());
    } else if (isPaused) {
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleStop = async () => {
    if (!selectedProjectId) {
      setError("Please select a project to save time entry.");
      return;
    }

    if (elapsedSeconds <= 0) {
      setError("Timer duration must be greater than 0.");
      return;
    }

    const nowIso = new Date().toISOString();
    const todayDate = new Date().toISOString().split("T")[0];

    const entryData = {
      project_id: selectedProjectId,
      description: description.trim() || "Timer task",
      duration_seconds: elapsedSeconds,
      entry_date: todayDate,
      type: "timer",
      started_at: startedAt || nowIso,
      ended_at: nowIso,
    };

    try {
      if (onTimerStopped) {
        await onTimerStopped(entryData);
      }
      // Reset state
      setIsStarted(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setDescription("");
      setStartedAt(null);
      setError("");
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save timer entry.");
    }
  };

  const formatTimerDisplay = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>⏱️</span> Active Timer
        </h2>
        {onOpenProjectModal && (
          <button
            type="button"
            onClick={onOpenProjectModal}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Manage Projects
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Project Selector */}
        <div className="md:col-span-4">
          <ProjectSelect
            projects={projects}
            selectedProjectId={selectedProjectId}
            onChange={(val) => {
              setSelectedProjectId(val);
              if (val) setError("");
            }}
            error={error}
            disabled={isRunning && !isPaused}
            required={true}
          />
        </div>

        {/* Task Description Input */}
        <div className="md:col-span-5 flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Task Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Timer Display & Actions */}
        <div className="md:col-span-3 flex flex-col items-center sm:items-end justify-center gap-2">
          <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
            {formatTimerDisplay(elapsedSeconds)}
          </div>

          <div className="flex items-center gap-2">
            {!isRunning || isPaused ? (
              <button
                type="button"
                onClick={handleStart}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow transition-colors flex items-center gap-1"
              >
                <span>▶</span> {isPaused ? "Resume" : "Start"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-lg shadow transition-colors flex items-center gap-1"
              >
                <span>⏸</span> Pause
              </button>
            )}

            {(isRunning || elapsedSeconds > 0) && (
              <button
                type="button"
                onClick={handleStop}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg shadow transition-colors flex items-center gap-1"
              >
                <span>⏹</span> Stop & Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
