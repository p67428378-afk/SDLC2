import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PaymentForm from "./PaymentForm";
import { mortgageService } from "../../services/api";

vi.mock("../../services/api", () => ({
  mortgageService: {
    validatePayment: vi.fn(),
  },
}));

describe("PaymentForm", () => {
  const mockAccounts = [
    {
      accountId: "acc-1",
      accountName: "Checking",
      accountType: "DDA",
      balance: 5000.0,
    },
    {
      accountId: "acc-2",
      accountName: "Savings",
      accountType: "Savings",
      balance: 10000.0,
    },
  ];

  it("renders form fields correctly", () => {
    render(<PaymentForm accounts={mockAccounts} onSubmit={() => {}} />);

    expect(screen.getByLabelText(/pay from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment amount/i)).toBeInTheDocument();
    expect(screen.getByText("Immediate")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("shows validation error if source account is not selected", async () => {
    render(<PaymentForm accounts={mockAccounts} onSubmit={() => {}} />);

    const submitButton = screen.getByRole("button", {
      name: /review payment/i,
    });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Please select a source account."),
    ).toBeInTheDocument();
  });

  it("shows validation error if amount is invalid", async () => {
    render(<PaymentForm accounts={mockAccounts} onSubmit={() => {}} />);

    // Select account
    fireEvent.change(screen.getByLabelText(/pay from/i), {
      target: { value: "acc-1" },
    });

    // Enter invalid amount
    fireEvent.change(screen.getByLabelText(/payment amount/i), {
      target: { value: "0.50" },
    });

    const submitButton = screen.getByRole("button", {
      name: /review payment/i,
    });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText(
        "Payment amount must be between $1.00 and $100,000.00.",
      ),
    ).toBeInTheDocument();
  });

  it("calls onSubmit when validation succeeds", async () => {
    const handleSubmit = vi.fn();
    mortgageService.validatePayment.mockResolvedValue({
      sufficientFunds: true,
      availableBalance: 5000.0,
    });

    render(<PaymentForm accounts={mockAccounts} onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/pay from/i), {
      target: { value: "acc-1" },
    });
    fireEvent.change(screen.getByLabelText(/payment amount/i), {
      target: { value: "100.00" },
    });

    const submitButton = screen.getByRole("button", {
      name: /review payment/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mortgageService.validatePayment).toHaveBeenCalledWith(
        "acc-1",
        100.0,
      );
      expect(handleSubmit).toHaveBeenCalledWith({
        source_account_id: "acc-1",
        amount: 100.0,
        payment_type: "IMMEDIATE",
        scheduled_date: null,
        availableBalance: 5000.0,
      });
    });
  });

  it("shows error if balance is insufficient", async () => {
    mortgageService.validatePayment.mockResolvedValue({
      sufficientFunds: false,
      availableBalance: 50.0,
    });

    render(<PaymentForm accounts={mockAccounts} onSubmit={() => {}} />);

    fireEvent.change(screen.getByLabelText(/pay from/i), {
      target: { value: "acc-1" },
    });
    fireEvent.change(screen.getByLabelText(/payment amount/i), {
      target: { value: "100.00" },
    });

    const submitButton = screen.getByRole("button", {
      name: /review payment/i,
    });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/insufficient funds/i)).toBeInTheDocument();
  });
});
