import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MortgageSummaryCard from "./MortgageSummaryCard";

describe("MortgageSummaryCard", () => {
  it("renders balance, due date, and minimum payment due", () => {
    render(
      <MortgageSummaryCard
        balance={245850.0}
        dueDate="June 1, 2026"
        minDue={1250.0}
        onMakePayment={() => {}}
      />,
    );

    expect(screen.getByText("Outstanding Balance")).toBeInTheDocument();
    expect(screen.getByText("$245,850.00")).toBeInTheDocument();
    expect(screen.getByText("June 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
  });

  it("calls onMakePayment when button is clicked", () => {
    const handleMakePayment = vi.fn();
    render(
      <MortgageSummaryCard
        balance={245850.0}
        dueDate="June 1, 2026"
        minDue={1250.0}
        onMakePayment={handleMakePayment}
      />,
    );

    const button = screen.getByRole("button", { name: /make payment/i });
    fireEvent.click(button);
    expect(handleMakePayment).toHaveBeenCalledTimes(1);
  });
});
