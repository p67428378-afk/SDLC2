import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EmployeeDashboard from "./EmployeeDashboard";
import * as AuthContext from "../context/AuthContext";
import { projectsAPI, timesheetsAPI } from "../services/api";

describe("EmployeeDashboard Component", () => {
  beforeEach(() => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: { id: "usr-1", email: "emp@example.com", role: "Employee" },
    });

    vi.spyOn(projectsAPI, "listProjects").mockResolvedValue([
      { id: "p1", name: "Project Alpha", active_status: true },
    ]);

    vi.spyOn(timesheetsAPI, "listTimesheets").mockResolvedValue([
      {
        id: "t1",
        project_id: "p1",
        date: new Date().toISOString().split("T")[0],
        hours_worked: 7.5,
        status: "approved",
      },
    ]);

    vi.spyOn(timesheetsAPI, "getSummary").mockResolvedValue({
      timeframe: "weekly",
      total_hours: 7.5,
      items: [
        {
          project_id: "p1",
          project_name: "Project Alpha",
          total_hours: 7.5,
          entry_count: 1,
        },
      ],
    });
  });

  it("renders dashboard heading, metric cards, and calendar", async () => {
    render(<EmployeeDashboard />);

    expect(
      screen.getByRole("heading", { name: /Employee Timesheet/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Total Logged/i)).toBeInTheDocument();
    expect(screen.getByText(/Approved/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();

    await waitFor(() => {
      const projectElements = screen.getAllByText("Project Alpha");
      expect(projectElements.length).toBeGreaterThan(0);
    });
  });
});
