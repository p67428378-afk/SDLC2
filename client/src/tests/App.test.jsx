import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App";

// Mock the API calls
vi.mock("../services/api", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMortgageDetails: vi.fn(),
  getFundingAccounts: vi.fn(),
  validateAccountBalance: vi.fn(),
  submitPayment: vi.fn(),
  getScheduledPayments: vi.fn(),
  getPaymentReceipt: vi.fn(),
}));

describe("App Smoke Test", () => {
  it("renders login page when not authenticated", () => {
    localStorage.removeItem("token");
    render(<App />);
    expect(screen.getAllByText(/Sign In/i)[0]).toBeInTheDocument();
  });
});
