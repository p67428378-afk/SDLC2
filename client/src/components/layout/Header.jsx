import React, { useState, useEffect } from "react";
import { mockService } from "../../services/api";

const Header = ({ onScenarioChange }) => {
  const [scenario, setScenario] = useState(
    localStorage.getItem("selectedScenario") || "default",
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleScenarioChange = async (e) => {
    const newScenario = e.target.value;
    setScenario(newScenario);
    localStorage.setItem("selectedScenario", newScenario);
    setStatusMessage("Configuring scenario...");
    setIsError(false);

    try {
      await mockService.configureMock(newScenario);
      setStatusMessage("Scenario configured successfully!");
      setIsError(false);
      if (onScenarioChange) {
        onScenarioChange(newScenario);
      }
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusMessage("");
      }, 3000);
    } catch (err) {
      console.error("Failed to configure scenario:", err);
      setStatusMessage("Failed to configure scenario");
      setIsError(true);
    }
  };

  return (
    <header className="fixed top-0 right-0 h-[64px] left-[260px] bg-surface-dim border-b border-outline-variant flex items-center justify-between px-lg z-10">
      <div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Unified Dashboard
        </h2>
        <p className="font-label-md text-label-md text-on-surface-variant">
          Welcome back, John
        </p>
      </div>

      <div className="flex items-center gap-md">
        {/* QA Scenario Injector */}
        <div className="flex items-center gap-xs bg-surface-container-high px-sm py-1 rounded-lg border border-outline-variant">
          <label
            htmlFor="scenario-select"
            className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mr-xs"
          >
            QA Scenario:
          </label>
          <select
            id="scenario-select"
            value={scenario}
            onChange={handleScenarioChange}
            className="bg-surface-dim border border-outline-variant text-on-surface text-body-md rounded px-xs py-1 focus:outline-none focus:border-primary"
          >
            <option value="default">Default (Multiple Accounts)</option>
            <option value="delinquent">Delinquent (Mortgage Due)</option>
            <option value="no_accounts">No Accounts (Empty List)</option>
            <option value="single_account">
              Single Account (Checking Only)
            </option>
            <option value="high_balance">High Balance (&gt; $500k)</option>
            <option value="error_fiserv">Error Fiserv (503)</option>
            <option value="error_cenlar">Error Cenlar (503)</option>
          </select>
          {statusMessage && (
            <span
              className={`font-label-md text-label-md ml-xs ${isError ? "text-error" : "text-secondary"}`}
            >
              {statusMessage}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-xs">
          <button className="relative p-xs text-on-surface-variant hover:text-primary transition-colors scale-95 active:scale-90 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <button className="p-xs text-on-surface-variant hover:text-primary transition-colors scale-95 active:scale-90 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">mail</span>
          </button>
          <button className="p-xs text-on-surface-variant hover:text-primary transition-colors scale-95 active:scale-90 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
