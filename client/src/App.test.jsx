import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import * as api from "./services/api";

// Mock the API service
vi.mock("./services/api", () => ({
  getKPIs: vi.fn(),
  getSKUs: vi.fn(),
  getScenario: vi.fn(),
  createSubmission: vi.fn(),
  getSubmission: vi.fn(),
}));

describe("DG Cluster Assortment Advisor Dashboard", () => {
  const mockKPIs = {
    sales_per_linear_ft: 1245.5,
    private_brand_pct: 24.5,
    in_stock_rate: 96.2,
    shelf_capacity: 4500,
  };

  const mockSKUs = [
    {
      sku_id: "SKU-10042",
      product_name: "Clover Valley Potato Chips, 8oz",
      sales: 4520,
      units_sold: 1250,
      sales_per_linear_ft: 85.2,
      is_private_brand: true,
      status: "GROW",
    },
  ];

  const mockScenario = {
    scenario_name: "Balanced",
    projected_sales_growth_pct: 12.5,
    projected_private_brand_pct: 25.5,
    projected_in_stock_rate: 95.8,
    projected_shelf_capacity_pct: 92.0,
    guardrails: {
      private_brand_pass: true,
      shelf_capacity_pass: true,
    },
    sku_actions: [
      {
        action_type: "ADD",
        sku_id: "SKU-10045",
        product_name: "Clover Valley Spicy Chips",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.getKPIs.mockResolvedValue(mockKPIs);
    api.getSKUs.mockResolvedValue(mockSKUs);
    api.getScenario.mockResolvedValue(mockScenario);
  });

  it("renders the dashboard with header, table, and panels", async () => {
    render(<App />);

    // Check header title
    expect(screen.getByText("Assortment Advisor")).toBeInTheDocument();

    // Wait for KPIs to load
    await waitFor(() => {
      expect(screen.getByText("$1,245.50")).toBeInTheDocument();
    });

    // Wait for SKUs to load
    await waitFor(() => {
      expect(
        screen.getByText("Clover Valley Potato Chips, 8oz"),
      ).toBeInTheDocument();
    });

    // Check scenario selector cards
    expect(screen.getByText("Conservative")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Aggressive")).toBeInTheDocument();

    // Check submit button
    expect(
      screen.getByRole("button", { name: /Submit for Approval/i }),
    ).toBeInTheDocument();
  });

  it("submits the selected scenario for approval and shows confirmation modal", async () => {
    const mockSubmission = {
      id: "sub-123",
      scenario_name: "Balanced",
      submitted_by: "John Doe",
      status: "PENDING",
      audit_trail_id: "audit-456",
      created_at: "2026-01-09T11:50:00Z",
    };

    api.createSubmission.mockResolvedValue(mockSubmission);

    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(
        screen.getByText("Clover Valley Potato Chips, 8oz"),
      ).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", {
      name: /Submit for Approval/i,
    });
    fireEvent.click(submitBtn);

    // Wait for modal to appear
    await waitFor(() => {
      expect(
        screen.getByText("Assortment Changes Submitted"),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("sub-123")).toBeInTheDocument();
    expect(screen.getByText("audit-456")).toBeInTheDocument();
  });
});
