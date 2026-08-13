import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Loader2 } from "lucide-react";

export default function DarkModeToggle() {
  const { darkMode, toggleTheme } = useTheme();
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState(null);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    setToggleError(null);
    try {
      await toggleTheme();
    } catch (err) {
      setToggleError("Failed to save theme preference.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-xl">
        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-on-surface">
            Dark Mode
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Switch between light and dark themes
          </span>
        </div>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            darkMode ? "bg-primary" : "bg-secondary-container"
          } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label="Toggle Dark Mode"
        >
          <span
            className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
              darkMode ? "translate-x-5" : "translate-translate-x-0"
            }`}
          >
            {isToggling ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            ) : darkMode ? (
              <Moon className="w-3 h-3 text-primary-container fill-primary-container" />
            ) : (
              <Sun className="w-3 h-3 text-on-secondary-container" />
            )}
          </span>
        </button>
      </div>
      {toggleError && (
        <p className="text-error font-label-sm text-label-sm" role="alert">
          {toggleError}
        </p>
      )}
    </div>
  );
}
