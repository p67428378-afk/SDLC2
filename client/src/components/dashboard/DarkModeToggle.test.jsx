import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DarkModeToggle from "./DarkModeToggle";
import { ThemeProvider } from "../../context/ThemeContext";
import { getUserProfile, updateUserPreferences } from "../../services/api";

vi.mock("../../services/api", () => ({
  getUserProfile: vi.fn(),
  updateUserPreferences: vi.fn(),
}));

describe("DarkModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders toggle button", async () => {
    getUserProfile.mockResolvedValueOnce({
      preferences: { dark_mode: false },
    });

    await act(async () => {
      render(
        <ThemeProvider>
          <DarkModeToggle />
        </ThemeProvider>,
      );
    });

    expect(screen.getByLabelText("Toggle Dark Mode")).toBeInTheDocument();
  });

  it("handles toggle click", async () => {
    getUserProfile.mockResolvedValueOnce({
      preferences: { dark_mode: false },
    });
    updateUserPreferences.mockResolvedValueOnce({
      dark_mode: true,
    });

    await act(async () => {
      render(
        <ThemeProvider>
          <DarkModeToggle />
        </ThemeProvider>,
      );
    });

    const toggleBtn = screen.getByLabelText("Toggle Dark Mode");
    await act(async () => {
      toggleBtn.click();
    });

    expect(updateUserPreferences).toHaveBeenCalledWith({ dark_mode: true });
  });
});
