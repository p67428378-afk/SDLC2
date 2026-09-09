import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

vi.mock("../services/api", () => ({
  listTransactions: vi.fn().mockResolvedValue([
    {
      id: "tx_101",
      customer_email: "buyer@example.com",
      amount: 150.0,
      currency: "USD",
      status: "COMPLETED",
      payment_method: "card",
      created_at: "2026-01-01T12:00:00Z",
    },
    {
      id: "tx_102",
      customer_email: "buyer2@example.com",
      amount: 50.0,
      currency: "EUR",
      status: "REFUNDED",
      payment_method: "apple_pay",
      created_at: "2026-01-01T13:00:00Z",
    },
  ]),
  listAuditLogs: vi.fn().mockResolvedValue([]),
}));

describe("AnalyticsDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders analytics dashboard and top KPI cards", async () => {
    render(<AnalyticsDashboard />);
    expect(
      screen.getByText(/Transaction Analytics Dashboard/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Total Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/Successful Revenue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("tx_101")).toBeInTheDocument();
      expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
    });
  });
});
