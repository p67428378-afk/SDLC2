import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LoanDetailsCard from "./LoanDetailsCard";

describe("LoanDetailsCard", () => {
  it("renders interest rate, escrow balance, and loan term", () => {
    render(
      <LoanDetailsCard
        interestRate={4.25}
        escrowBalance={4500.0}
        loanTerm="30-Year Fixed"
        maturityDate="May 1, 2050"
      />,
    );

    expect(screen.getByText("Interest Rate")).toBeInTheDocument();
    expect(screen.getByText("4.25%")).toBeInTheDocument();
    expect(screen.getByText("$4,500.00")).toBeInTheDocument();
    expect(screen.getByText("30-Year Fixed")).toBeInTheDocument();
    expect(screen.getByText("Maturity Date: May 1, 2050")).toBeInTheDocument();
  });
});
