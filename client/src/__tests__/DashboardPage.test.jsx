import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import { dashboardService } from "../services/api";

// Mock services
vi.mock("../services/api", () => ({
  dashboardService: {
    getDashboard: vi.fn(),
  },
  mockService: {
    configureMock: vi.fn(),
  },
  authService: {
    logout: vi.fn(),
  },
  default: {
    interceptors: {
      request: { use: vi.fn() },
    },
  },
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("DashboardPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    dashboardService.getDashboard.mockReturnValue(new Promise(() => {}));
    renderWithRouter(<DashboardPage />);
    expect(screen.getByText(/Loading dashboard data.../i)).toBeInTheDocument();
  });

  it("renders dashboard data successfully", async () => {
    const mockData = {
      netWorth: 342150,
      totalDeposits: 112150,
      totalMortgage: 230000,
      accounts: [
        {
          id: "1",
          name: "High-Yield Savings",
          institution: "Fiserv",
          type: "Savings",
          balance: 85400,
          status: "Active",
          accountNumber: "SAV-1234",
        },
      ],
    };

    dashboardService.getDashboard.mockResolvedValueOnce(mockData);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("$342,150.00")).toBeInTheDocument();
      expect(screen.getByText("$112,150.00")).toBeInTheDocument();
      expect(screen.getByText("$230,000.00")).toBeInTheDocument();
      expect(screen.getByText("High-Yield Savings")).toBeInTheDocument();
    });
  });
});
