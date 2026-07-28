import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoanSummaryCard from "../components/mortgage/LoanSummaryCard";
import PaymentForm from "../components/mortgage/PaymentForm";
import PaymentReviewCard from "../components/mortgage/PaymentReviewCard";
import PaymentSuccessCard from "../components/mortgage/PaymentSuccessCard";
import ScheduledPaymentsTable from "../components/mortgage/ScheduledPaymentsTable";

// Mock the API calls
vi.mock("../services/api", () => ({
  validateAccountBalance: vi.fn(() =>
    Promise.resolve({ sufficientFunds: true, availableBalance: 5000 }),
  ),
}));

describe("Mortgage Components Tests", () => {
  const mockLoanDetails = {
    currentBalance: 245850.0,
    nextPaymentDueDate: "2026-06-01",
    minimumPaymentAmount: 1250.0,
    loanNumber: "30049182",
  };

  const mockAccounts = [
    {
      accountId: "1",
      accountName: "DDA Account",
      accountType: "DDA",
      balance: 5000,
    },
    {
      accountId: "2",
      accountName: "Savings Account",
      accountType: "Savings",
      balance: 10000,
    },
  ];

  describe("LoanSummaryCard", () => {
    it("renders loan details correctly", () => {
      render(
        <LoanSummaryCard
          details={mockLoanDetails}
          onMakePaymentClick={() => {}}
        />,
      );
      expect(screen.getByText("$245,850.00")).toBeInTheDocument();
      expect(screen.getByText("2026-06-01")).toBeInTheDocument();
      expect(screen.getByText("$1,250.00")).toBeInTheDocument();
    });
  });

  describe("PaymentForm", () => {
    it("renders form fields correctly", () => {
      render(
        <PaymentForm
          loanDetails={mockLoanDetails}
          accounts={mockAccounts}
          onSubmit={() => {}}
          onCancel={() => {}}
        />,
      );
      expect(
        screen.getByLabelText(/Select Funding Account/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Payment Amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Payment Date/i)).toBeInTheDocument();
    });
  });

  describe("PaymentReviewCard", () => {
    it("renders review details correctly", () => {
      const mockPaymentData = {
        amount: 1250.0,
        date: "2026-06-01",
        fromAccountId: "1",
        loanNumber: "30049182",
      };
      render(
        <PaymentReviewCard
          paymentData={mockPaymentData}
          account={mockAccounts[0]}
          onConfirm={() => {}}
          onEdit={() => {}}
          isSubmitting={false}
        />,
      );
      expect(screen.getByText("DDA Account (DDA)")).toBeInTheDocument();
      expect(screen.getByText("$1,250.00")).toBeInTheDocument();
      expect(screen.getByText("2026-06-01")).toBeInTheDocument();
    });
  });

  describe("PaymentSuccessCard", () => {
    it("renders success details correctly", () => {
      const mockResult = {
        transactionId: "TXN-12345",
        cenlarConfirmationId: "CEN-67890",
        status: "SUBMITTED",
        timestamp: "2026-05-18T12:00:00Z",
      };
      render(
        <PaymentSuccessCard
          result={mockResult}
          onDownloadReceipt={() => {}}
          onGoToDetails={() => {}}
        />,
      );
      expect(screen.getByText("TXN-12345")).toBeInTheDocument();
      expect(screen.getByText("CEN-67890")).toBeInTheDocument();
      expect(screen.getByText("SUBMITTED")).toBeInTheDocument();
    });
  });

  describe("ScheduledPaymentsTable", () => {
    it("renders scheduled payments correctly", () => {
      const mockPayments = [
        {
          paymentId: "P-1",
          paymentDate: "2026-06-01",
          amount: 1250.0,
          status: "SCHEDULED",
        },
      ];
      render(<ScheduledPaymentsTable payments={mockPayments} />);
      expect(screen.getByText("P-1")).toBeInTheDocument();
      expect(screen.getByText("2026-06-01")).toBeInTheDocument();
      expect(screen.getByText("$1,250.00")).toBeInTheDocument();
    });
  });
});
