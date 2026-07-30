import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PersonalProfileCard from "./PersonalProfileCard";

describe("PersonalProfileCard", () => {
  it("renders profile information correctly", () => {
    const mockProfile = {
      first_name: "John",
      last_name: "Smith",
      cif: "CIF-123456",
      relationship_manager: "Sarah Jenkins",
    };

    render(<PersonalProfileCard profile={mockProfile} />);

    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Smith")).toBeInTheDocument();
    expect(screen.getByText("CIF-123456")).toBeInTheDocument();
    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
  });

  it("renders default values when profile is missing", () => {
    render(<PersonalProfileCard profile={null} />);

    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
    expect(screen.getByText("CIF-982341")).toBeInTheDocument();
  });
});
