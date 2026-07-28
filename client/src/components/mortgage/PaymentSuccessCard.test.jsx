import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PaymentSuccessCard from "./PaymentSuccessCard";

describe("PaymentSuccessCard", () => {
  const mockReceipt = {
    amount: 1250.0,
    mortgage_account_id: "30049182",
    paymentId: "pay-123",
    receiptId: "REC-123",
    source_account_id: "acc-123456",
    status: "COMPLETED",
    timestamp: "2026-06-01T12:00:00Z",
    transaction_reference: "TXN-123",
  };

  it("renders receipt details correctly", () => {
    render(
      <PaymentSuccessCard
        receipt={mockReceipt}
        onDone={() => {}}
        onViewScheduled={() => {}}
      />,
    );

    expect(screen.getByText("Payment Confirmed")).toBeInTheDocument();
    expect(screen.getByText("REC-123")).toBeInTheDocument();
    expect(screen.getByText("TXN-123")).toBeInTheDocument();
    expect(screen.getByText("pay-123")).toBeInTheDocument();
    expect(screen.getByText("****3456")).toBeInTheDocument();
    expect(screen.getByText("Loan #30049182")).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
  });

  it("calls onDone when back to details button is clicked", () => {
    const handleDone = vi.fn();
    render(
      <PaymentSuccessCard
        receipt={mockReceipt}
        onDone={handleDone}
        onViewScheduled={() => {}}
      />,
    );

    const button = screen.getByRole("button", { name: /back to details/i });
    fireEvent.click(button);
    expect(handleDone).toHaveBeenCalledTimes(1);
  });
});
