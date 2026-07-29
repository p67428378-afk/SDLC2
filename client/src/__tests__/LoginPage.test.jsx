import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import { authService } from "../services/api";

// Mock the authService
vi.mock("../services/api", () => {
  return {
    authService: {
      login: vi.fn(),
      verifyMfa: vi.fn(),
      getCurrentUser: vi.fn(),
      isAuthenticated: vi.fn(),
    },
    default: {
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with default credentials", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    expect(screen.getByLabelText(/username \/ email/i)).toHaveValue(
      "test@example.com",
    );
    expect(screen.getByLabelText(/password/i)).toHaveValue("testpassword");
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("submits login and transitions to MFA step", async () => {
    authService.login.mockResolvedValueOnce({ mfa_token: "mock-mfa-token" });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        "test@example.com",
        "testpassword",
      );
      expect(
        screen.getByLabelText(/enter 6-digit mfa code/i),
      ).toBeInTheDocument();
    });
  });

  it("submits MFA code and logs in successfully", async () => {
    authService.login.mockResolvedValueOnce({ mfa_token: "mock-mfa-token" });
    authService.verifyMfa.mockResolvedValueOnce({
      access_token: "mock-jwt",
      user: { username: "test@example.com" },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    // Step 1: Login
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Step 2: MFA
    await waitFor(() => {
      expect(
        screen.getByLabelText(/enter 6-digit mfa code/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /verify & proceed/i }));

    await waitFor(() => {
      expect(authService.verifyMfa).toHaveBeenCalledWith(
        "123456",
        "mock-mfa-token",
      );
    });
  });
});
