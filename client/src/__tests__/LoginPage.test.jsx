import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import { authService } from "../services/api";

// Mock authService
vi.mock("../services/api", () => ({
  authService: {
    login: vi.fn(),
    verifyMfa: vi.fn(),
    logout: vi.fn(),
  },
  default: {
    interceptors: {
      request: { use: vi.fn() },
    },
  },
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form by default", () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByLabelText(/Username \/ Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign In/i }),
    ).toBeInTheDocument();
  });

  it("submits login credentials and transitions to MFA step", async () => {
    authService.login.mockResolvedValueOnce({ mfa_token: "mock-mfa-token" });

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Username \/ Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "testpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        "test@example.com",
        "testpassword",
      );
      expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument();
    });
  });

  it("shows error message on login failure", async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { detail: "Invalid credentials" } },
    });

    renderWithRouter(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid credentials",
      );
    });
  });
});
