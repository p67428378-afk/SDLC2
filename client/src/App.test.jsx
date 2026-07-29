import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// Mock the pages to keep tests simple and fast
vi.mock("./pages/LoginPage", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

describe("App Component", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });
});
