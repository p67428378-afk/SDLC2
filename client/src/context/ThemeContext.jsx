import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserProfile, updateUserPreferences } from "../services/api";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch theme preference on initial load
  useEffect(() => {
    async function fetchTheme() {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        const isDark = profile?.preferences?.dark_mode || false;
        setDarkMode(isDark);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (err) {
        console.error("Failed to fetch theme preference:", err);
        setError("Could not load theme preference from server.");
      } finally {
        setLoading(false);
      }
    }
    fetchTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !darkMode;
    try {
      setError(null);
      // Update backend
      await updateUserPreferences({ dark_mode: newMode });
      // Update local state and DOM
      setDarkMode(newMode);
      if (newMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (err) {
      console.error("Failed to update theme preference:", err);
      setError("Failed to save theme preference to server.");
      throw err; // Let the component handle/display the error
    }
  };

  return (
    <ThemeContext.Provider
      value={{ darkMode, toggleTheme, loading, error, setError }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
