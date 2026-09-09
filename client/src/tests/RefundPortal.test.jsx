import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RefundPortal from "../components/RefundPortal";

vi.mock("../services/api", () => ({
  listTransactions: vi.fn().mockResolvedValue([
    {
      id: "tx_999",
      customer_email: "testuser@example.com",
      amount: 100.0,
      currency: "USD",
      status: "COMPLETED",
      payment_method: "card",
      created_at: "2026-01-01T10:00:00Z",
    },
  ]),
  getTransactionDetail: vi.fn().mockResolvedValue({
    id: "tx_999",
    customer_email: "testuser@example.com",
    amount: 100.0,
    converted_amount: 100.0,
    target_currency: "USD",
    status: "COMPLETED",
    refunded_amount: 0.0,
    remaining_refundable_balance: 100.0,
    created_at: "2026-01-01T10:00:00Z",
  }),
  createRefund: vi.fn().mockResolvedValue({
    id: "ref_123",
    transaction_id: "tx_999",
    refund_amount: 50.0,
    currency: "USD",
    status: "COMPLETED",
    reason: "Customer Request",
    created_at: "2026-01-01T11:00:00Z",
  }),
  listAuditLogs: vi.fn().mockResolvedValue([]),
}));

describe("RefundPortal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders refund management heading and transaction list", async () => {
    render(<RefundPortal />);
    expect(screen.getByText(/Refund Management Portal/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("tx_999")).toBeInTheDocument();
      expect(screen.getByText("testuser@example.com")).toBeInTheDocument();
    });
  });

  it("opens inspect modal on button click", async () => {
    render(<RefundPortal />);

    await waitFor(() => {
      expect(screen.getByText("tx_999")).toBeInTheDocument();
    });

    const inspectBtn = screen.getByRole("button", {
      name: /Inspect \/ Refund/i,
    });
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Transaction Inspection & Refund/i),
      ).toBeInTheDocument();
    });
  });
});
