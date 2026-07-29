import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PersonalInfoCard from "./PersonalInfoCard";

describe("PersonalInfoCard Component", () => {
  const mockProfile = {
    first_name: "Jane",
    last_name: "Doe",
    cif: "CIF-982341",
  };

  it("renders personal information fields", () => {
    render(<PersonalInfoCard profile={mockProfile} />);
    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Last Name")).toBeInTheDocument();
    expect(screen.getByText("CIF Number")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
    expect(screen.getByText("CIF-982341")).toBeInTheDocument();
  });
});
