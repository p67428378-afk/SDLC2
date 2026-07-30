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
});
