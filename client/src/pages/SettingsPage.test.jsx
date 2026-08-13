import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SettingsPage from "./SettingsPage";
import { ThemeProvider } from "../context/ThemeContext";
import { getUserProfile } from "../services/api";

vi.mock("../services/api", () => ({
  getUserProfile: vi.fn(),
  updateUserPreferences: vi.fn(),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings page with user profile", async () => {
    getUserProfile.mockResolvedValue({
      id: "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
      email: "user@example.com",
      preferences: { dark_mode: false },
    });

    await act(async () => {
      render(
        <ThemeProvider>
          <SettingsPage />
        </ThemeProvider>,
      );
    });

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6"),
    ).toBeInTheDocument();
  });
});
