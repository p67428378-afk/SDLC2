import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ApprovalReviewPanel from "./ApprovalReviewPanel.jsx";

describe("ApprovalReviewPanel Component", () => {
  const mockPassedGuardrails = {
    all_passed: true,
    guardrails: [
      {
        name: "Shelf Capacity",
        status: "PASSED",
        message: "Within limits (8.0% headroom)",
        value: 92.0,
        threshold: 100.0,
        operator: "<=",
      },
      {
        name: "Private Brand Share",
        status: "PASSED",
        message: "Exceeds target by +3.0%",
        value: 28.0,
        threshold: 25.0,
        operator: ">=",
      },
      {
        name: "In-Stock SLA Rate",
        status: "PASSED",
        message: "Cluster SLA satisfied",
        value: 96.5,
        threshold: 95.0,
        operator: ">=",
      },
    ],
  };

  it("renders guardrail statuses and enabled submit button when all pass", () => {
    const handleSubmit = vi.fn();
    render(
      <ApprovalReviewPanel
        selectedScenario="Balanced"
        guardrailStatus={mockPassedGuardrails}
        onSubmit={handleSubmit}
        submitting={false}
        skuCount={12}
      />,
    );

    expect(screen.getByTestId("approval-review-panel")).toBeInTheDocument();
    expect(screen.getByText(/All Guardrails Passed/i)).toBeInTheDocument();
    expect(screen.getByText("Shelf Capacity")).toBeInTheDocument();
    expect(screen.getByText("Private Brand Share")).toBeInTheDocument();
    expect(screen.getByText("In-Stock SLA Rate")).toBeInTheDocument();

    const submitBtn = screen.getByTestId("submit-assortment-plan-btn");
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables submit button when guardrails fail", () => {
    const mockFailedGuardrails = {
      all_passed: false,
      guardrails: [
        {
          name: "Shelf Capacity",
          status: "FAILED",
          message: "Exceeds max threshold",
          value: 104.0,
          threshold: 100.0,
          operator: "<=",
        },
      ],
    };

    render(
      <ApprovalReviewPanel
        selectedScenario="Aggressive"
        guardrailStatus={mockFailedGuardrails}
        onSubmit={vi.fn()}
        submitting={false}
      />,
    );

    const submitBtn = screen.getByTestId("submit-assortment-plan-btn");
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Guardrail Violations/i)).toBeInTheDocument();
  });
});
