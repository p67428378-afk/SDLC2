import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DailySummary from "../components/summary/DailySummary.jsx";

describe("DailySummary Component", () => {
  it("renders zero time logged message when no summary projects are present", () => {
    render(
      <DailySummary
        dailySummary={{ formatted_total: "0h 0m", projects: [] }}
      />,
    );
    expect(screen.getByText("Total Hours Today: 0h 0m")).toBeInTheDocument();
    expect(
      screen.getByText("No time logged for today yet."),
    ).toBeInTheDocument();
  });

  it("renders daily total and project breakdown with color badges", () => {
    const mockSummary = {
      formatted_total: "4h 15m",
      projects: [
        {
          project_id: "p1",
          project_name: "Website Redesign",
          color_code: "#3B82F6",
          formatted_duration: "3h 15m",
        },
        {
          project_id: "p2",
          project_name: "Internal Admin",
          color_code: "#6B7280",
          formatted_duration: "1h 0m",
        },
      ],
    };

    render(<DailySummary dailySummary={mockSummary} />);
    expect(screen.getByText("Total Hours Today: 4h 15m")).toBeInTheDocument();
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("3h 15m")).toBeInTheDocument();
    expect(screen.getByText("Internal Admin")).toBeInTheDocument();
    expect(screen.getByText("1h 0m")).toBeInTheDocument();
  });
});
