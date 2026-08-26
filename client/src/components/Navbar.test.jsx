import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Navbar from "./Navbar";
import * as AuthContext from "../context/AuthContext";

describe("Navbar Component", () => {
  it("renders brand name and unauthenticated navigation links", () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: null,
      logout: vi.fn(),
      isManager: false,
      isEmployee: false,
      isAuthenticated: false,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>,
    );

    expect(screen.getByText(/TimeTrack Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  it("renders employee links when logged in as Employee", () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: { email: "employee@example.com", role: "Employee" },
      logout: vi.fn(),
      isManager: false,
      isEmployee: true,
      isAuthenticated: true,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Weekly Timesheet/i)).toBeInTheDocument();
    expect(screen.getByText("employee@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pending Approvals/i)).not.toBeInTheDocument();
  });

  it("renders manager links when logged in as Manager", () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: { email: "manager@example.com", role: "Manager" },
      logout: vi.fn(),
      isManager: true,
      isEmployee: false,
      isAuthenticated: true,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Pending Approvals/i)).toBeInTheDocument();
    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
  });
});
