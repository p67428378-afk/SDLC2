import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Badge from "./Badge";

describe("Badge Component", () => {
  it("renders children correctly", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });
});
