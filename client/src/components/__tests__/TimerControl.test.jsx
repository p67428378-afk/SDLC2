import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TimerControl from "../timer/TimerControl";

const mockProjects = [
  { id: "proj-1", name: "Website Redesign", color_code: "#3B82F6" },
  { id: "proj-2", name: "Internal Admin", color_code: "#6B7280" },
];

describe("TimerControl Component", () => {
  it("renders timer controls and project selector", () => {
    render(<TimerControl projects={mockProjects} />);

    expect(screen.getByText(/Active Timer/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/What are you working on\?/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("shows validation message if start clicked without project selection", () => {
    render(<TimerControl projects={mockProjects} />);

    const startButton = screen.getByText("Start");
    fireEvent.click(startButton);

    expect(
      screen.getByText(/Please select a project before starting the timer/i),
    ).toBeInTheDocument();
  });

  it("allows starting timer when project is selected", () => {
    render(<TimerControl projects={mockProjects} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "proj-1" } });

    const startButton = screen.getByText("Start");
    fireEvent.click(startButton);

    expect(screen.getByText("Pause")).toBeInTheDocument();
  });
});
