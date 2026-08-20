import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TimerControl from "../components/timer/TimerControl.jsx";

describe("TimerControl Component", () => {
  const mockProjects = [
    { id: "p1", name: "Website Redesign", color_code: "#3B82F6" },
    { id: "p2", name: "Internal Admin", color_code: "#6B7280" },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders active timer header and project selector", () => {
    render(<TimerControl projects={mockProjects} />);
    expect(screen.getByText(/Active Timer/i)).toBeInTheDocument();
    expect(screen.getByText("-- Select a Project --")).toBeInTheDocument();
  });

  it("shows error when trying to start without selecting a project", () => {
    render(<TimerControl projects={mockProjects} />);
    const startButton = screen.getByRole("button", { name: /Start/i });
    fireEvent.click(startButton);
    expect(
      screen.getByText("Please select a project before starting the timer."),
    ).toBeInTheDocument();
  });

  it("allows starting timer after selecting a project", () => {
    render(<TimerControl projects={mockProjects} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "p1" } });

    const startButton = screen.getByRole("button", { name: /Start/i });
    fireEvent.click(startButton);

    expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument();
  });
});
