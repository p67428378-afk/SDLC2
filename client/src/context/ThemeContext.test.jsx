import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { getUserProfile, updateUserPreferences } from "../services/api";

vi.mock("../services/api", () => ({
  getUserProfile: vi.fn(),
  updateUserPreferences: vi.fn(),
}));

function TestComponent() {
  const { darkMode, toggleTheme, loading, error } = useTheme();
  return (
    <div>
      {loading && <span data-testid="loading">Loading...</span>}
      {error && <span data-testid="error">{error}</span>}
      <span data-testid="theme">{darkMode ? "dark" : "light"}</span>
      <button onClick={toggleTheme} data-testid="toggle">
        Toggle
      </button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove("dark");
  });

  it("fetches and applies theme on mount", async () => {
    getUserProfile.mockResolvedValueOnce({
      preferences: { dark_mode: true },
    });

    await act(async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );
    });

    expect(getUserProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles theme and updates backend", async () => {
    getUserProfile.mockResolvedValueOnce({
      preferences: { dark_mode: false },
    });
    updateUserPreferences.mockResolvedValueOnce({
      dark_mode: true,
    });

    await act(async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );
    });

    expect(screen.getByTestId("theme").textContent).toBe("light");

    await act(async () => {
      screen.getByTestId("toggle").click();
    });

    expect(updateUserPreferences).toHaveBeenCalledWith({ dark_mode: true });
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
