import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InlineConfirmation from "./InlineConfirmation.jsx";

describe("InlineConfirmation Component", () => {
  const mockSubmission = {
    status: "SUCCESS",
    audit_id: "AUD-2026-99482",
    timestamp: "2026-09-10T11:00:00Z",
    message: "Assortment plan submitted successfully.",
    sku_decisions_count: 12,
  };

  it("renders nothing when submissionResult is null", () => {
    const { container } = render(
      <InlineConfirmation submissionResult={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders audit id and decisions count upon submission", () => {
    render(<InlineConfirmation submissionResult={mockSubmission} />);
    expect(
      screen.getByTestId("inline-confirmation-banner"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Assortment plan submitted successfully."),
    ).toBeInTheDocument();
    expect(screen.getByText("AUD-2026-99482")).toBeInTheDocument();
    expect(screen.getByText(/12 SKU decisions/i)).toBeInTheDocument();
    expect(screen.getByText("Immutable Audit Record")).toBeInTheDocument();
  });

  it("triggers onDismiss when close button is clicked", () => {
    const handleDismiss = vi.fn();
    render(
      <InlineConfirmation
        submissionResult={mockSubmission}
        onDismiss={handleDismiss}
      />,
    );
    const closeBtn = screen.getByLabelText("Dismiss banner");
    fireEvent.click(closeBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
