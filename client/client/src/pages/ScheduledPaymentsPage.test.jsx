import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ScheduledPaymentsPage from "./ScheduledPaymentsPage";
import { dashboardService } from "../services/api";
import { paymentService } from "../services/paymentService";

// Mock services
vi.mock("../services/api", () => ({
  dashboardService: {
    getDashboard: vi.fn(),
  },
}));

vi.mock("../services/paymentService", () => ({
  paymentService: {
    getScheduledPayments: vi.fn(),
    schedulePayment: vi.fn(),
    cancelScheduledPayment: vi.fn(),
  },
}));

// Mock AppLayout
vi.mock("../components/layout/AppLayout", () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

describe("ScheduledPaymentsPage", () => {
  const mockDashboard = {
    accounts: {
      deposits: [
        {
          id: "fiserv-dda-1",
          name: "Primary Checking",
          account_number: "•••• 4321",
          balance: 12450.0,
          type: "DDA",
        },
      ],
      loans: [],
      mortgages: [
        {
          id: "cenlar-mort-1",
          name: "Home Mortgage",
          account_number: "•••• 1122",
          principal_balance: 345000.0,
        },
      ],
    },
  };

  const mockScheduled = [
    {
      id: "sched-1",
      user_id: "user-1",
      source_account_id: "fiserv-dda-1",
      mortgage_account_id: "cenlar-mort-1",
      amount: 2150.0,
      scheduled_date: "2026-06-15",
      status: "PENDING",
      created_at: "2026-05-18T12:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders scheduled payments list", async () => {
    dashboardService.getDashboard.mockResolvedValue(mockDashboard);
    paymentService.getScheduledPayments.mockResolvedValue(mockScheduled);

    render(
      <MemoryRouter initialEntries={["/scheduled-payments"]}>
        <Routes>
          <Route
            path="/scheduled-payments"
            element={<ScheduledPaymentsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Scheduled Payments")).toBeInTheDocument();
    });

    expect(screen.getByText("Pending Scheduled Payments")).toBeInTheDocument();
    expect(screen.getByText("$2,150.00")).toBeInTheDocument();
  });
});
