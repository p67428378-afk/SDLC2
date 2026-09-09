import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CheckoutPage from "../components/CheckoutPage";

vi.mock("../services/api", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    session_id: "sess_123",
    payment_intent_id: "pi_123",
    base_amount: 49.99,
    base_currency: "USD",
    target_amount: 49.99,
    target_currency: "USD",
    exchange_rate: 1.0,
  }),
  payWithDigitalWallet: vi.fn().mockResolvedValue({
    transaction_id: "tx_wallet_123",
    payment_intent_id: "pi_wallet_123",
    status: "COMPLETED",
    amount: 49.99,
    currency: "USD",
    wallet_type: "apple_pay",
  }),
  getExchangeRates: vi.fn().mockResolvedValue({
    base_currency: "USD",
    rates: { USD: 1.0, EUR: 0.925, GBP: 0.79, JPY: 155.0, CAD: 1.36 },
    timestamp: "2026-01-01T00:00:00Z",
  }),
}));

describe("CheckoutPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders checkout title and order summary", async () => {
    render(<CheckoutPage />);
    expect(screen.getByText(/Checkout & Payment/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro Subscription/i)).toBeInTheDocument();
  });

  it("renders card input fields and customer email", () => {
    render(<CheckoutPage />);
    expect(
      screen.getByDisplayValue("customer@example.com"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
  });

  it("submits checkout form when card details are valid", async () => {
    render(<CheckoutPage />);
    const submitBtn = screen.getByRole("button", { name: /Pay USD/i });
    expect(submitBtn).toBeInTheDocument();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Payment Successful!/i)).toBeInTheDocument();
    });
  });

  it("triggers digital wallet payment on Apple Pay button click", async () => {
    render(<CheckoutPage />);
    const applePayBtn = screen.getByRole("button", { name: /Apple Pay/i });
    fireEvent.click(applePayBtn);

    await waitFor(() => {
      expect(screen.getByText(/Apple Pay Authorized!/i)).toBeInTheDocument();
    });
  });
});
