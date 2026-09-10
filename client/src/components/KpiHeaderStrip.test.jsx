import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KpiHeaderStrip from "./KpiHeaderStrip.jsx";

describe("KpiHeaderStrip Component", () => {
  it("renders loading state when loading is true and metrics is null", () => {
    render(<KpiHeaderStrip metrics={null} loading={true} />);
    expect(screen.getByTestId("kpi-header-loading")).toBeInTheDocument();
  });

  it("renders default metrics correctly when loaded", () => {
    const mockMetrics = {
      sales_per_linear_ft: 450.0,
      private_brand_pct: 28.0,
      in_stock_rate_pct: 96.5,
      shelf_capacity_pct: 92.0,
    };

    render(<KpiHeaderStrip metrics={mockMetrics} loading={false} />);
    expect(screen.getByTestId("kpi-header-strip")).toBeInTheDocument();
    expect(screen.getByText("Sales per Linear Foot")).toBeInTheDocument();
    expect(screen.getByText("$450.00")).toBeInTheDocument();
    expect(screen.getByText("Private Brand Share")).toBeInTheDocument();
    expect(screen.getByText("28.0%")).toBeInTheDocument();
    expect(screen.getByText("In-Stock Rate")).toBeInTheDocument();
    expect(screen.getByText("96.5%")).toBeInTheDocument();
    expect(screen.getByText("Shelf Capacity Utilization")).toBeInTheDocument();
    expect(screen.getByText("92.0%")).toBeInTheDocument();
  });
});
