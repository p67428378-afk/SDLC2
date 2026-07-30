import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PaymentConfirmationPage from "./PaymentConfirmationPage";

// Mock AppLayout
vi.mock("../components/layout/AppLayout", () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

describe("PaymentConfirmationPage", () => {
  const mockState = {
    receipt: {
      confirmation_number: "CONF-123456",
      amount: 2150.0,
      source_account_id: "fiserv-dda-1",
      mortgage_account_id: "cenlar-mort-1",
      payment_date: "2026-05-18T12:00:00Z",
      updated_source_balance: 10300.0,
      updated_mortgage_balance: 342850.0,
    },
    sourceAccount: {
      name: "Primary Checking",
      account_number: "•••• 4321",
    },
    mortgageAccount: {
      name: "Home Mortgage",
    },
  };

  it("renders confirmation details", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/payment-confirmation", state: mockState },
        ]}
      >
        <Routes>
          <Route
            path="/payment-confirmation"
            element={<PaymentConfirmationPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
    expect(screen.getByText("CONF-123456")).toBeInTheDocument();
    expect(screen.getByText("$2,150.00")).toBeInTheDocument();
  });
});
