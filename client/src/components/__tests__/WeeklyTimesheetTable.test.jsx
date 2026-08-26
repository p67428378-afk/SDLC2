import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WeeklyTimesheetTable from "../WeeklyTimesheetTable";

describe("WeeklyTimesheetTable Component", () => {
  const mockEntries = [
    {
      id: "entry-1",
      date: "2026-05-18",
      project_id: "proj-1",
      project: { id: "proj-1", name: "Project Alpha" },
      hours_worked: 8,
      description: "Developed authentication module",
      status: "pending",
    },
    {
      id: "entry-2",
      date: "2026-05-19",
      project_id: "proj-2",
      project: { id: "proj-2", name: "Project Beta" },
      hours_worked: 7.5,
      description: "Tested timesheet approval flow",
      status: "approved",
    },
    {
      id: "entry-3",
      date: "2026-05-20",
      project_id: "proj-1",
      project: { id: "proj-1", name: "Project Alpha" },
      hours_worked: 4,
      description: "Bug fix in hours summary",
      status: "rejected",
      rejection_reason: "Incorrect hour calculation",
    },
  ];

  it("renders weekly table headers, week navigation, and summary statistics", () => {
    render(
      <WeeklyTimesheetTable
        currentDate={new Date("2026-05-18")}
        onPrevWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onToday={vi.fn()}
        entries={mockEntries}
        loading={false}
        onOpenNewEntryModal={vi.fn()}
        onEditEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
      />,
    );

    expect(screen.getByText("Weekly Timesheet View")).toBeInTheDocument();
    expect(screen.getByText("19.5 hrs")).toBeInTheDocument(); // Total hours: 8 + 7.5 + 4
    expect(screen.getAllByText("Project Alpha").length).toBeGreaterThan(0);
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rejected").length).toBeGreaterThan(0);
    expect(screen.getByText(/Incorrect hour calculation/i)).toBeInTheDocument();
  });

  it("calls onOpenNewEntryModal when Log Hours button is clicked", () => {
    const handleOpenModal = vi.fn();
    render(
      <WeeklyTimesheetTable
        currentDate={new Date("2026-05-18")}
        onPrevWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onToday={vi.fn()}
        entries={[]}
        loading={false}
        onOpenNewEntryModal={handleOpenModal}
        onEditEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
      />,
    );

    const logHoursBtn = screen.getByRole("button", { name: /Log Hours/i });
    fireEvent.click(logHoursBtn);
    expect(handleOpenModal).toHaveBeenCalledTimes(1);
  });

  it("triggers onEditEntry and onDeleteEntry for pending entries", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <WeeklyTimesheetTable
        currentDate={new Date("2026-05-18")}
        onPrevWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onToday={vi.fn()}
        entries={mockEntries}
        loading={false}
        onOpenNewEntryModal={vi.fn()}
        onEditEntry={handleEdit}
        onDeleteEntry={handleDelete}
      />,
    );

    const editBtn = screen.getByLabelText("Edit entry entry-1");
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockEntries[0]);

    const deleteBtn = screen.getByLabelText("Delete entry entry-1");
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith("entry-1");
  });
});
