import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PaymentReviewCard from "./PaymentReviewCard";

describe("PaymentReviewCard", () => {
  const mockData = {
    source_account_id: "acc-123456",
    amount: 1250.0,
    payment_type: "IMMEDIATE",
    scheduled_date: null,
  };

  it("renders payment details correctly", () => {
    render(
      <PaymentReviewCard
        data={mockData}
        mortgageAccount="30049182"
        onConfirm={() => {}}
        onBack={() => {}}
        isSubmitting={false}
        error=""
      />,
    );

    expect(screen.getByText("Review Your Payment")).toBeInTheDocument();
    expect(screen.getByText("Account ****3456")).toBeInTheDocument();
    expect(screen.getByText("Loan #30049182")).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
    expect(screen.getByText("Immediate (Today)")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const handleConfirm = vi.fn();
    render(
      <PaymentReviewCard
        data={mockData}
        mortgageAccount="30049182"
        onConfirm={handleConfirm}
        onBack={() => {}}
        isSubmitting={false}
        error=""
      />,
    );

    const button = screen.getByRole("button", { name: /confirm & submit/i });
    fireEvent.click(button);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows error message if provided", () => {
    render(
      <PaymentReviewCard
        data={mockData}
        mortgageAccount="30049182"
        onConfirm={() => {}}
        onBack={() => {}}
        isSubmitting={false}
        error="Something went wrong"
      />,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
