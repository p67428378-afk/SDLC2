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
