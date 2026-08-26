import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CalendarGrid from "./CalendarGrid";

describe("CalendarGrid Component", () => {
  const mockProjects = [
    {
      id: "proj-1",
      name: "Alpha Project",
      description: "Test project 1",
      active_status: true,
    },
  ];

  const mockEntries = [
    {
      id: "entry-1",
      project_id: "proj-1",
      date: "2026-05-18",
      hours_worked: 8,
      status: "pending",
      description: "Worked on feature",
    },
  ];

  const mockDate = new Date("2026-05-18T00:00:00.000Z");

  it("renders weekly hours matrix with days and projects", () => {
    render(
      <CalendarGrid
        currentWeekStart={mockDate}
        onPrevWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onTodayWeek={vi.fn()}
        projects={mockProjects}
        entries={mockEntries}
        onSaveEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
      />,
    );

    expect(screen.getByText(/Weekly Hours Matrix/i)).toBeInTheDocument();
    expect(screen.getByText("Alpha Project")).toBeInTheDocument();
    expect(screen.getByText(/8h/i)).toBeInTheDocument();
  });

  it("handles week navigation buttons", () => {
    const prevSpy = vi.fn();
    const nextSpy = vi.fn();

    render(
      <CalendarGrid
        currentWeekStart={mockDate}
        onPrevWeek={prevSpy}
        onNextWeek={nextSpy}
        onTodayWeek={vi.fn()}
        projects={mockProjects}
        entries={[]}
        onSaveEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
      />,
    );

    const prevBtn = screen.getByTitle(/Previous Week/i);
    const nextBtn = screen.getByTitle(/Next Week/i);

    fireEvent.click(prevBtn);
    expect(prevSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(nextBtn);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });
});
