import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PaymentReviewPage from "./PaymentReviewPage";
import { paymentService } from "../services/paymentService";

// Mock paymentService
vi.mock("../services/paymentService", () => ({
  paymentService: {
    executePayment: vi.fn(),
  },
}));

// Mock AppLayout
vi.mock("../components/layout/AppLayout", () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

describe("PaymentReviewPage", () => {
  const mockState = {
    mortgageId: "cenlar-mort-1",
    sourceId: "fiserv-dda-1",
    amount: 2150.0,
    sourceAccount: {
      id: "fiserv-dda-1",
      name: "Primary Checking",
      account_number: "•••• 4321",
      balance: 12450.0,
    },
    mortgageAccount: {
      id: "cenlar-mort-1",
      name: "Home Mortgage",
      account_number: "•••• 1122",
      principal_balance: 345000.0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders payment review details", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/payment-review", state: mockState }]}
      >
        <Routes>
          <Route path="/payment-review" element={<PaymentReviewPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Review Mortgage Payment")).toBeInTheDocument();
    expect(screen.getByText("Primary Checking")).toBeInTheDocument();
    expect(screen.getByText("Home Mortgage")).toBeInTheDocument();
  });
});
