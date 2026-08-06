import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SecuritySettingsPlaceholder from "./SecuritySettingsPlaceholder";

describe("SecuritySettingsPlaceholder", () => {
  it("renders placeholder text correctly", () => {
    render(<SecuritySettingsPlaceholder />);

    expect(screen.getByText("Password Management")).toBeInTheDocument();
    expect(
      screen.getByText("Security features coming in Phase 4..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Phase 4")).toBeInTheDocument();
  });

  it("renders support contact guidance, phone number, and email address", () => {
    render(<SecuritySettingsPlaceholder />);

    expect(
      screen.getByText("Need to reset your password now? Contact us."),
    ).toBeInTheDocument();
    expect(screen.getByText("1-800-555-0100")).toBeInTheDocument();
    expect(screen.getByText("support@tfsbank.com")).toBeInTheDocument();

    const phoneLink = screen.getByText("1-800-555-0100").closest("a");
    expect(phoneLink).toHaveAttribute("href", "tel:1-800-555-0100");

    const emailLink = screen.getByText("support@tfsbank.com").closest("a");
    expect(emailLink).toHaveAttribute("href", "mailto:support@tfsbank.com");
  });
});
