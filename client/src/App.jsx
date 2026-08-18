import React, { useState, useEffect } from "react";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("timetracker_theme");
      if (saved !== null) {
        return saved === "dark";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (darkMode) {
        root.classList.add("dark");
        localStorage.setItem("timetracker_theme", "dark");
      } else {
        root.classList.remove("dark");
        localStorage.setItem("timetracker_theme", "light");
      }
    } catch (e) {
      console.error("Failed to apply dark mode:", e);
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return <DashboardPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
}
