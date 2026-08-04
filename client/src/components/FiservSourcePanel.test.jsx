import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FiservSourcePanel from "./FiservSourcePanel";

describe("FiservSourcePanel Component", () => {
  const mockRawSource = {
    Status: {
      StatusCode: 0,
      Severity: "Info",
    },
    AcctRec: {
      DepositAcctInfo: {
        Amt: 12500.5,
        AcctTitle: "Checking Account",
        AcctDtlStatus: "Active",
      },
    },
  };

  it("returns null when rawSource is missing or null (mock mode)", () => {
    const { container } = render(<FiservSourcePanel rawSource={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when rawSource is an empty object", () => {
    const { container } = render(<FiservSourcePanel rawSource={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the expand toggle button when rawSource is provided", () => {
    render(<FiservSourcePanel rawSource={mockRawSource} />);
    expect(screen.getByText("View Fiserv Source Data")).toBeInTheDocument();
  });

  it("is collapsed by default and expands when clicked to show raw JSON", () => {
    render(<FiservSourcePanel rawSource={mockRawSource} />);

    // Initially collapsed: Unmodified Fiserv API Payload should not be visible
    expect(
      screen.queryByText("Unmodified Fiserv API Payload"),
    ).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("View Fiserv Source Data"));

    // Now expanded
    expect(
      screen.getByText("Unmodified Fiserv API Payload"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Checking Account/)).toBeInTheDocument();
    expect(screen.getByText(/AcctDtlStatus/)).toBeInTheDocument();
  });
});
