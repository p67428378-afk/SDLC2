import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import { dashboardService } from "../services/api";

// Mock react-router-dom's useOutletContext
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useOutletContext: () => ({ scenarioKey: 0 }),
  };
});

describe("DashboardPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    const spy = vi
      .spyOn(dashboardService, "getDashboard")
      .mockReturnValue(new Promise(() => {})); // never resolves

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/loading dashboard data.../i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it("renders dashboard structure successfully", async () => {
    const mockData = {
      accounts: [
        {
          id: "1",
          accountNumber: "123",
          name: "Checking",
          institution: "Fiserv",
          type: "Checking",
          balance: 1000,
          status: "Active",
        },
        {
          id: "2",
          accountNumber: "456",
          name: "Mortgage",
          institution: "Cenlar",
          type: "Mortgage",
          balance: 200000,
          status: "Active",
        },
      ],
      netWorth: 201000,
      totalDeposits: 1000,
      totalMortgage: 200000,
    };

    const spy = vi
      .spyOn(dashboardService, "getDashboard")
      .mockResolvedValue(mockData);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    // Wait for loading to disappear
    await waitFor(() => {
      expect(
        screen.queryByText(/loading dashboard data.../i),
      ).not.toBeInTheDocument();
    });

    // Assert that key sections are present
    expect(screen.getByText(/Your Aggregated Accounts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Checking/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mortgage/i).length).toBeGreaterThan(0);

    spy.mockRestore();
  });

  it("renders error state when API fails", async () => {
    const spy = vi.spyOn(dashboardService, "getDashboard").mockRejectedValue({
      response: { data: { detail: "Fiserv API returns 503" } },
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Fiserv API returns 503/i)).toBeInTheDocument();
    });

    spy.mockRestore();
  });
});
