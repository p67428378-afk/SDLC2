import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PaymentBreakdownCard from "./PaymentBreakdownCard";

describe("PaymentBreakdownCard", () => {
  it("renders estimated payment breakdown correctly", () => {
    render(<PaymentBreakdownCard amount={1000.0} />);

    expect(screen.getByText("Estimated Payment Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("$400.00")).toBeInTheDocument(); // 40%
    expect(screen.getByText("Interest")).toBeInTheDocument();
    expect(screen.getByText("$450.00")).toBeInTheDocument(); // 45%
    expect(screen.getByText("Escrow (Taxes & Insurance)")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument(); // 15%
    expect(screen.getByText("$1,000.00")).toBeInTheDocument(); // Total
  });
});
