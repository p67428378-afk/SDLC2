import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProjectManagementModal from "../projects/ProjectManagementModal";

const mockProjects = [
  { id: "proj-1", name: "Website Redesign", color_code: "#3B82F6" },
];

describe("ProjectManagementModal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ProjectManagementModal isOpen={false} projects={mockProjects} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header, form, and table when isOpen is true", () => {
    render(
      <ProjectManagementModal
        isOpen={true}
        onClose={() => {}}
        projects={mockProjects}
      />,
    );

    expect(screen.getByText("Project Management (CRUD)")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. Website Redesign"),
    ).toBeInTheDocument();
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
  });
});
