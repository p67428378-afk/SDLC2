import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import * as AuthContext from "./context/AuthContext";

describe("App Component", () => {
  it("renders without crashing", () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn(),
      isManager: false,
      isEmployee: false,
      isAuthenticated: false,
    });

    render(<App />);
    const brandingElements = screen.getAllByText(/TimeTrack Pro/i);
    expect(brandingElements.length).toBeGreaterThan(0);
  });
});
