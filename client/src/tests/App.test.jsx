import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App";

// Mock the API services
vi.mock("../services/api", () => ({
  authService: {
    isAuthenticated: () => false,
    getCurrentUser: () => null,
    login: vi.fn(),
    logout: vi.fn(),
  },
  mortgageService: {
    getDetails: vi.fn(),
    getPaymentHistory: vi.fn(),
  },
  accountService: {
    listAccounts: vi.fn(),
  },
  paymentService: {
    validatePayment: vi.fn(),
    submitPayment: vi.fn(),
  },
  scheduledPaymentService: {
    listScheduled: vi.fn(),
  },
}));

describe("App Routing Smoke Test", () => {
  it("renders login page when unauthenticated", () => {
    render(<App />);
    expect(screen.getByText(/Sign in to Apex Bank/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });
});
