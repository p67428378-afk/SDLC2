import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DepositAccountsTable from "./DepositAccountsTable";

describe("DepositAccountsTable Component", () => {
  const mockAccounts = [
    {
      id: "acc-1",
      name: "Premier Checking",
      type: "Checking",
      account_number: "1234567890",
      interest_rate: 5.5,
      status: "Active",
      balance: 10500.5,
    },
  ];

  it("renders all six column headers in correct order", () => {
    render(<DepositAccountsTable accounts={mockAccounts} />);

    const headers = screen
      .getAllByRole("columnheader")
      .map((th) => th.textContent.trim());
    expect(headers).toEqual([
      "Account Name",
      "Type",
      "Account Number",
      "Interest Rate",
      "Status",
      "Balance",
    ]);
  });

  it("renders account details including interest rate percentage and status pill", () => {
    render(<DepositAccountsTable accounts={mockAccounts} />);

    expect(screen.getByText("Premier Checking")).toBeInTheDocument();
    expect(screen.getByText("Checking")).toBeInTheDocument();
    expect(screen.getByText("•••• 7890")).toBeInTheDocument();
    expect(screen.getByText("5.5%")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("$10,500.50")).toBeInTheDocument();
  });

  it("handles account row click correctly", () => {
    const handleAccountClick = vi.fn();
    render(
      <DepositAccountsTable
        accounts={mockAccounts}
        onAccountClick={handleAccountClick}
      />,
    );

    const accountRow = screen.getByText("Premier Checking").closest("tr");
    fireEvent.click(accountRow);

    expect(handleAccountClick).toHaveBeenCalledWith("fiserv", "acc-1");
  });

  it("renders empty state with colSpan=6 when no accounts are provided", () => {
    render(<DepositAccountsTable accounts={[]} />);

    const emptyCell = screen.getByText("No deposit accounts found.");
    expect(emptyCell).toBeInTheDocument();
    expect(emptyCell).toHaveAttribute("colspan", "6");
  });
});
