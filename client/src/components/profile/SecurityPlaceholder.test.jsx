import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SecurityPlaceholder from "./SecurityPlaceholder";

describe("SecurityPlaceholder Component", () => {
  it("renders security placeholder text", () => {
    render(<SecurityPlaceholder />);
    expect(screen.getByText("Security Settings")).toBeInTheDocument();
    expect(
      screen.getByText("Password Management (Phase 4)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/security features coming in phase 4/i),
    ).toBeInTheDocument();
  });
});
