import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ScheduledPaymentsTable from "./ScheduledPaymentsTable";

describe("ScheduledPaymentsTable", () => {
  it("renders empty state when no payments are provided", () => {
    render(<ScheduledPaymentsTable payments={[]} />);

    expect(screen.getByText("No Scheduled Payments")).toBeInTheDocument();
  });

  it("renders list of scheduled payments correctly", () => {
    const mockPayments = [
      {
        paymentId: "pay-1",
        paymentDate: "2026-07-01T00:00:00Z",
        amount: 1250.0,
        status: "SCHEDULED",
      },
      {
        paymentId: "pay-2",
        paymentDate: "2026-08-01T00:00:00Z",
        amount: 1250.0,
        status: "SCHEDULED",
      },
    ];

    render(<ScheduledPaymentsTable payments={mockPayments} />);

    expect(screen.getByText("Scheduled Payments")).toBeInTheDocument();
    expect(screen.getByText("pay-1")).toBeInTheDocument();
    expect(screen.getByText("pay-2")).toBeInTheDocument();
    expect(screen.getAllByText("$1,250.00")).toHaveLength(2);
  });
});
