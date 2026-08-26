import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ManagerDashboard from "./ManagerDashboard";
import { timesheetsAPI, projectsAPI } from "../services/api";

describe("ManagerDashboard Component", () => {
  beforeEach(() => {
    vi.spyOn(projectsAPI, "listProjects").mockResolvedValue([
      {
        id: "p1",
        name: "Alpha Project",
        description: "Alpha",
        active_status: true,
      },
    ]);

    vi.spyOn(timesheetsAPI, "listTimesheets").mockResolvedValue([
      {
        id: "ts-1",
        user_id: "u1",
        project_id: "p1",
        date: "2026-05-18",
        hours_worked: 8,
        status: "pending",
        user: { email: "emp@example.com" },
        project: { name: "Alpha Project" },
      },
    ]);

    vi.spyOn(timesheetsAPI, "getSummary").mockResolvedValue({
      timeframe: "weekly",
      total_hours: 8,
      items: [
        {
          project_id: "p1",
          project_name: "Alpha Project",
          total_hours: 8,
          entry_count: 1,
        },
      ],
    });
  });

  it("renders manager portal with timesheet approval table", async () => {
    render(<ManagerDashboard />);

    expect(
      screen.getByRole("heading", { name: /Manager Portal/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Timesheet Approvals/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("emp@example.com")).toBeInTheDocument();
      const projElements = screen.getAllByText("Alpha Project");
      expect(projElements.length).toBeGreaterThan(0);
    });
  });

  it("switches to project management tab", async () => {
    render(<ManagerDashboard />);

    const projTabBtn = screen.getByRole("button", { name: /Projects/i });
    fireEvent.click(projTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Create New Project/i)).toBeInTheDocument();
      expect(screen.getByText(/Configured Projects/i)).toBeInTheDocument();
    });
  });
});
