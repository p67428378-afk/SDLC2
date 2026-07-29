import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProfileCard from "./ProfileCard";

describe("ProfileCard Component", () => {
  const mockProfile = {
    first_name: "Jane",
    last_name: "Doe",
    cif: "CIF-982341",
    relationship_manager: "Robert Vance",
  };

  it("renders profile initials and full name", () => {
    render(<ProfileCard profile={mockProfile} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders CIF and relationship manager", () => {
    render(<ProfileCard profile={mockProfile} />);
    expect(screen.getByText("CIF-982341")).toBeInTheDocument();
    expect(screen.getByText("Robert Vance")).toBeInTheDocument();
  });
});
