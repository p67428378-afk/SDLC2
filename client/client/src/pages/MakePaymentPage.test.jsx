import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import MakePaymentPage from "./MakePaymentPage";
import { dashboardService } from "../services/api";
import { paymentService } from "../services/paymentService";

// Mock services
vi.mock("../services/api", () => ({
  dashboardService: {
    getAccountDetail: vi.fn(),
  },
  authService: {
    isAuthenticated: () => true,
  },
}));

vi.mock("../services/paymentService", () => ({
  paymentService: {
    getPaymentSources: vi.fn(),
  },
}));

// Mock AppLayout to avoid rendering sidebar/header complexity
vi.mock("../components/layout/AppLayout", () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

describe("MakePaymentPage", () => {
  const mockMortgage = {
    id: "cenlar-mort-1",
    name: "Home Mortgage",
    account_number: "•••• 1122",
    principal_balance: 345000.0,
    next_payment_amount: 2150.0,
    next_payment_due: "2026-06-01",
  };

  const mockSources = [
    {
      id: "fiserv-dda-1",
      name: "Primary Checking",
      account_number: "•••• 4321",
      balance: 12450.0,
      type: "DDA",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    dashboardService.getAccountDetail.mockReturnValue(new Promise(() => {}));
    paymentService.getPaymentSources.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/make-payment?id=cenlar-mort-1"]}>
        <Routes>
          <Route path="/make-payment" element={<MakePaymentPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading payment details.../i)).toBeInTheDocument();
  });

  it("renders payment details after loading", async () => {
    dashboardService.getAccountDetail.mockResolvedValue(mockMortgage);
    paymentService.getPaymentSources.mockResolvedValue(mockSources);

    render(
      <MemoryRouter initialEntries={["/make-payment?id=cenlar-mort-1"]}>
        <Routes>
          <Route path="/make-payment" element={<MakePaymentPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Make Mortgage Payment")).toBeInTheDocument();
    });

    expect(screen.getByText("Home Mortgage")).toBeInTheDocument();
    expect(screen.getByText("Sufficient funds available.")).toBeInTheDocument();
  });
});
