import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProjectManagementModal from "../components/projects/ProjectManagementModal.jsx";

describe("ProjectManagementModal Component", () => {
  const mockProjects = [
    { id: "p1", name: "Website Redesign", color_code: "#3B82F6" },
    { id: "p2", name: "Internal Admin", color_code: "#6B7280" },
  ];

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ProjectManagementModal isOpen={false} projects={mockProjects} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header and projects table when isOpen is true", () => {
    render(<ProjectManagementModal isOpen={true} projects={mockProjects} />);
    expect(
      screen.getByText(/Project Management \(CRUD\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("Internal Admin")).toBeInTheDocument();
  });

  it("switches to create form tab when clicking Add Project button", () => {
    render(<ProjectManagementModal isOpen={true} projects={mockProjects} />);
    const addButton = screen.getByRole("button", { name: /\+ Add Project/i });
    fireEvent.click(addButton);
    expect(screen.getByText("Create New Project")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. Website Redesign"),
    ).toBeInTheDocument();
  });
});
