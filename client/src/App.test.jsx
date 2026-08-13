import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App.jsx";

// Mock the API services
vi.mock("./services/api.js", () => ({
  getTodaySummary: vi.fn(() =>
    Promise.resolve({ entries: [], total_duration_seconds: 0 }),
  ),
  listTimeEntries: vi.fn(() => Promise.resolve([])),
  createTimeEntry: vi.fn(() => Promise.resolve({})),
  deleteTimeEntry: vi.fn(() => Promise.resolve({})),
  getUserProfile: vi.fn(() =>
    Promise.resolve({
      id: "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
      email: "user@example.com",
      preferences: { dark_mode: false },
    }),
  ),
  updateUserPreferences: vi.fn(() =>
    Promise.resolve({
      id: "pref-id",
      user_id: "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
      dark_mode: false,
      updated_at: "2026-08-13T11:20:10.789987+00:00",
    }),
  ),
}));

describe("App Smoke Test", () => {
  it("renders without crashing", async () => {
    render(<App />);

    // Check if the main title is rendered
    const titleElements = screen.getAllByText(/Time Tracker/i);
    expect(titleElements.length).toBeGreaterThan(0);

    // Check if the sidebar logo text is rendered
    expect(screen.getByText("Chronos")).toBeInTheDocument();
  });
});
