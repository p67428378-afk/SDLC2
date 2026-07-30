import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatCard from "./StatCard";

describe("StatCard Component", () => {
  it("renders title and value correctly", () => {
    render(
      <StatCard
        title="Total Assets"
        value="$100,000.00"
        icon="account_balance"
      />,
    );
    expect(screen.getByText(/total assets/i)).toBeInTheDocument();
    expect(screen.getByText(/\$100,000.00/i)).toBeInTheDocument();
  });
});
