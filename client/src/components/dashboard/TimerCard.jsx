import React, { useState, useEffect, useRef } from "react";

export default function TimerCard({ onTimerStopped }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    const savedStartedAt = localStorage.getItem("timer_started_at");
    const savedElapsed = parseInt(
      localStorage.getItem("timer_elapsed_seconds") || "0",
      10,
    );

    if (savedStartedAt) {
      setIsRunning(true);
      const startTime = new Date(savedStartedAt).getTime();
      const calculateElapsed = () => {
        const now = new Date().getTime();
        const diff = Math.floor((now - startTime) / 1000);
        setElapsed(savedElapsed + diff);
      };
      calculateElapsed();
      intervalRef.current = setInterval(calculateElapsed, 1000);
    } else {
      setElapsed(savedElapsed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStart = () => {
    setError("");
    const now = new Date().toISOString();
    localStorage.setItem("timer_started_at", now);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const startTime = new Date(now).getTime();
      const currentNow = new Date().getTime();
      const diff = Math.floor((currentNow - startTime) / 1000);
      const savedElapsed = parseInt(
        localStorage.getItem("timer_elapsed_seconds") || "0",
        10,
      );
      setElapsed(savedElapsed + diff);
    }, 1000);
  };

  const handleStop = async () => {
    setError("");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const startedAt = localStorage.getItem("timer_started_at");
    const endedAt = new Date().toISOString();
    const savedElapsed = parseInt(
      localStorage.getItem("timer_elapsed_seconds") || "0",
      10,
    );
    const startTime = new Date(startedAt).getTime();
    const diff = Math.floor((new Date(endedAt).getTime() - startTime) / 1000);
    const totalDuration = savedElapsed + diff;

    if (totalDuration <= 0) {
      setError("No time elapsed to log.");
      localStorage.removeItem("timer_started_at");
      localStorage.setItem("timer_elapsed_seconds", "0");
      setIsRunning(false);
      setElapsed(0);
      return;
    }

    try {
      await onTimerStopped({
        type: "timed",
        description: description.trim() || "Timed Entry",
        duration_seconds: totalDuration,
        started_at: startedAt,
        ended_at: endedAt,
      });
      localStorage.removeItem("timer_started_at");
      localStorage.setItem("timer_elapsed_seconds", "0");
      setIsRunning(false);
      setElapsed(0);
      setDescription("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to save timed entry. Please try again.",
      );
    }
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col justify-between relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
      <div>
        <div className="flex items-center gap-2 mb-xs">
          {isRunning ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-outline"></span>
          )}
          <p className="font-label-sm text-label-sm text-primary">
            {isRunning ? "Active Timer" : "Timer Stopped"}
          </p>
        </div>
        <p className="font-display-lg text-display-lg text-on-surface tabular-nums">
          {formatTime(elapsed)}
        </p>

        <div className="mt-3">
          <input
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-container-highest border border-outline-variant rounded px-2 py-1 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>

      <div className="mt-md">
        {isRunning ? (
          <button
            onClick={handleStop}
            className="w-full bg-error-container hover:bg-error text-on-error-container font-label-md py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined filled text-sm">
              pause
            </span>
            Stop Timer
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="w-full bg-primary hover:bg-primary-fixed text-on-primary-fixed font-label-md py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined filled text-sm">
              play_arrow
            </span>
            Start Timer
          </button>
        )}
      </div>
    </div>
  );
}
