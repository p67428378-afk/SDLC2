import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SkuPerformanceTable from "./SkuPerformanceTable.jsx";

describe("SkuPerformanceTable Component", () => {
  const mockSkus = [
    {
      id: "1",
      sku_code: "SKU-10492",
      product_name: "DG Value Pretzels 12oz",
      category: "Snacks",
      weekly_velocity: 142.5,
      margin_pct: 34.2,
      linear_feet: 1.5,
      is_private_brand: true,
      status_badge: "GROW",
    },
    {
      id: "2",
      sku_code: "SKU-8821",
      product_name: "Slow Chips 6oz",
      category: "Snacks",
      weekly_velocity: 18.0,
      margin_pct: 12.5,
      linear_feet: 2.0,
      is_private_brand: false,
      status_badge: "SWAP",
    },
  ];

  it("renders table headers and SKU rows", () => {
    render(<SkuPerformanceTable skus={mockSkus} loading={false} />);
    expect(screen.getByTestId("sku-performance-table")).toBeInTheDocument();
    expect(screen.getByText("SKU-10492")).toBeInTheDocument();
    expect(screen.getByText("DG Value Pretzels 12oz")).toBeInTheDocument();
    expect(screen.getByText("SKU-8821")).toBeInTheDocument();
    expect(screen.getByText("Slow Chips 6oz")).toBeInTheDocument();
  });

  it("filters SKUs based on search input", () => {
    render(<SkuPerformanceTable skus={mockSkus} loading={false} />);
    const searchInput = screen.getByLabelText("Search SKU or product");
    fireEvent.change(searchInput, { target: { value: "Pretzels" } });

    expect(screen.getByText("DG Value Pretzels 12oz")).toBeInTheDocument();
    expect(screen.queryByText("Slow Chips 6oz")).not.toBeInTheDocument();
  });

  it("calls onActionChange when select value is modified", () => {
    const handleActionChange = vi.fn();
    render(
      <SkuPerformanceTable
        skus={mockSkus}
        loading={false}
        onActionChange={handleActionChange}
      />,
    );

    const select = screen.getByLabelText("Action badge for SKU-10492");
    fireEvent.change(select, { target: { value: "MAINTAIN" } });

    expect(handleActionChange).toHaveBeenCalledWith("SKU-10492", "MAINTAIN");
  });
});
