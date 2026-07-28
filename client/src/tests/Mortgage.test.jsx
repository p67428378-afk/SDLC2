import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoanInfoGrid from "../components/mortgage/LoanInfoGrid";
import PaymentHistoryTable from "../components/mortgage/PaymentHistoryTable";

describe("Mortgage Components Tests", () => {
  const mockMortgage = {
    id: "MTG-88492",
    loanNumber: "MTG-88492",
    outstandingBalance: 250000.0,
    nextPaymentDueDate: "2026-08-01",
    minimumPaymentDue: 1500.0,
    interestRate: 4.25,
    escrowBalance: 3450.0,
    loanTerm: "30 Years",
    maturityDate: "2056-07-01",
  };

  const mockHistory = [
    {
      date: "2026-07-01",
      description: "Regular Payment",
      confirmationNumber: "CONF-12345",
      amount: 1500.0,
      status: "COMPLETED",
    },
  ];

  it("renders LoanInfoGrid correctly", () => {
    render(<LoanInfoGrid mortgage={mockMortgage} />);
    expect(screen.getByText(/Interest Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/4.25%/i)).toBeInTheDocument();
    expect(screen.getByText(/Escrow Balance/i)).toBeInTheDocument();
    expect(screen.getByText(/\$3,450.00/i)).toBeInTheDocument();
  });

  it("renders PaymentHistoryTable correctly", () => {
    render(<PaymentHistoryTable history={mockHistory} />);
    expect(screen.getByText(/Recent Payment History/i)).toBeInTheDocument();
    expect(screen.getByText(/Regular Payment/i)).toBeInTheDocument();
    expect(screen.getByText(/CONF-12345/i)).toBeInTheDocument();
  });
});
