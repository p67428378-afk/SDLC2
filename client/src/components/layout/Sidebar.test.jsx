import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "./Sidebar";

// Mock authService
vi.mock("../../services/api", () => ({
  authService: {
    logout: vi.fn(),
  },
}));

describe("Sidebar", () => {
  it("renders navigation links correctly", () => {
    const mockProfile = {
      first_name: "Jane",
      last_name: "Doe",
      cif: "CIF-982341",
    };

    render(
      <MemoryRouter>
        <Sidebar userProfile={mockProfile} />
      </MemoryRouter>,
    );

    expect(screen.getByText("TFS")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Account Summary")).toBeInTheDocument();
    expect(screen.getByText("Relationship Overview")).toBeInTheDocument();
    expect(screen.getByText("Account Details")).toBeInTheDocument();
    expect(screen.getByText("Scheduled Payments")).toBeInTheDocument();
    expect(screen.getByText("Profile Settings")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("CIF-982341")).toBeInTheDocument();
  });
});
