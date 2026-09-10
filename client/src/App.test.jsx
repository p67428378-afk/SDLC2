import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App.jsx";

// Mock API service calls to avoid unhandled rejections during test
vi.mock("./services/api.js", () => ({
  getKpiMetrics: vi.fn().mockResolvedValue({
    cluster_name: "Small Town Value Cluster",
    category: "Snacks",
    sales_per_linear_ft: 450.0,
    private_brand_pct: 28.0,
    in_stock_rate_pct: 96.5,
    shelf_capacity_pct: 92.0,
    last_updated: "2026-09-10T11:00:00Z",
  }),
  getSkus: vi.fn().mockResolvedValue({
    total: 4,
    items: [
      {
        sku_code: "SKU-10492",
        product_name: "DG Value Pretzels 12oz",
        category: "Snacks",
        weekly_velocity: 142.5,
        margin_pct: 34.2,
        linear_feet: 1.5,
        is_private_brand: true,
        status_badge: "GROW",
      },
    ],
  }),
  getScenarios: vi.fn().mockResolvedValue([
    {
      scenario_type: "Balanced",
      projected_sales_lift_pct: 5.8,
      projected_private_brand_share_pct: 28.0,
      projected_margin_delta_pct: 1.5,
      recommended_sku_actions: { GROW: 4, MAINTAIN: 5, SWAP: 2, REDUCE: 1 },
    },
  ]),
  evaluateScenario: vi.fn().mockResolvedValue({
    scenario_type: "Balanced",
    projected_sales_lift_pct: 5.8,
    projected_private_brand_share_pct: 28.0,
    projected_margin_delta_pct: 1.5,
    recommended_sku_actions: { GROW: 4, MAINTAIN: 5, SWAP: 2, REDUCE: 1 },
  }),
  checkGuardrails: vi.fn().mockResolvedValue({
    all_passed: true,
    guardrails: [
      {
        name: "Shelf Capacity",
        status: "PASSED",
        message: "Within limits (8.0% headroom)",
        value: 92.0,
        threshold: 100.0,
        operator: "<=",
      },
      {
        name: "Private Brand Share",
        status: "PASSED",
        message: "Exceeds target by +3.0%",
        value: 28.0,
        threshold: 25.0,
        operator: ">=",
      },
      {
        name: "In-Stock SLA Rate",
        status: "PASSED",
        message: "Cluster SLA satisfied",
        value: 96.5,
        threshold: 95.0,
        operator: ">=",
      },
    ],
  }),
  createSubmission: vi.fn().mockResolvedValue({
    status: "SUCCESS",
    audit_id: "AUD-2026-99482",
    timestamp: "2026-09-10T11:00:00Z",
    message: "Assortment plan submitted successfully.",
    sku_decisions_count: 12,
  }),
}));

describe("App Main Dashboard", () => {
  it("renders the header with Dollar General Branding", async () => {
    render(<App />);
    expect(
      screen.getByText("Dollar General — Cluster Assortment Advisor"),
    ).toBeInTheDocument();
    expect(screen.getByText("DG")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("kpi-header-strip")).toBeInTheDocument();
    });
  });

  it("renders all main sections on a single canvas", async () => {
    render(<App />);
    expect(await screen.findByTestId("kpi-header-strip")).toBeInTheDocument();
    expect(screen.getByTestId("sku-performance-table")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-selector")).toBeInTheDocument();
    expect(screen.getByTestId("approval-review-panel")).toBeInTheDocument();
  });
});
