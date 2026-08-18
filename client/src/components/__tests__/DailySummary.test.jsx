import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DailySummary from "../summary/DailySummary";

describe("DailySummary Component", () => {
  it("renders total time and empty state when no entries", () => {
    render(
      <DailySummary
        summaryData={{ formatted_total: "0h 0m", projects: [] }}
        selectedDate="2026-05-18"
        onDateChange={() => {}}
      />,
    );

    expect(screen.getByText("Daily Summary")).toBeInTheDocument();
    expect(screen.getByText("0h 0m")).toBeInTheDocument();
    expect(
      screen.getByText(/No time logged for this date/i),
    ).toBeInTheDocument();
  });

  it("renders project time summaries with badges when data exists", () => {
    const summaryData = {
      formatted_total: "4h 15m",
      total_duration_seconds: 15300,
      projects: [
        {
          project_id: "proj-1",
          project_name: "Website Redesign",
          color_code: "#3B82F6",
          total_duration_seconds: 11700,
          formatted_duration: "3h 15m",
          entries_count: 2,
        },
        {
          project_id: "proj-2",
          project_name: "Internal Admin",
          color_code: "#6B7280",
          total_duration_seconds: 3600,
          formatted_duration: "1h 0m",
          entries_count: 1,
        },
      ],
    };

    render(
      <DailySummary
        summaryData={summaryData}
        selectedDate="2026-05-18"
        onDateChange={() => {}}
      />,
    );

    expect(screen.getByText("4h 15m")).toBeInTheDocument();
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("3h 15m")).toBeInTheDocument();
    expect(screen.getByText("Internal Admin")).toBeInTheDocument();
    expect(screen.getByText("1h 0m")).toBeInTheDocument();
  });
});
