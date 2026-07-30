import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/dashboard/StatCard";
import DepositAccountsTable from "../components/dashboard/DepositAccountsTable";
import MortgageOverviewCard from "../components/dashboard/MortgageOverviewCard";
import { dashboardService } from "../services/api";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dash, summary] = await Promise.all([
          dashboardService.getDashboard(),
          dashboardService.getSummary(),
        ]);
        setDashboardData(dash);
        setSummaryData(summary);
      } catch (err) {
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAccountClick = (source, accountId) => {
    navigate(`/details?source=${source}&id=${accountId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm text-center">
          <span className="material-symbols-outlined text-error text-5xl">
            error
          </span>
          <h2 className="mt-4 text-xl font-bold text-on-surface">
            Error Loading Dashboard
          </h2>
          <p className="mt-2 text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-primary text-on-primary font-label-md py-2 px-4 rounded-xl hover:bg-primary-container transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { customer_profile, accounts } = dashboardData;
  const { deposits, loans, mortgages } = accounts;

  // Filter deposits and loans based on search query
  const filteredDeposits = deposits.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.account_number.includes(searchQuery),
  );

  const filteredLoans = loans.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.account_number.includes(searchQuery),
  );

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const currentDateStr = new Date().toLocaleDateString("en-US", dateOptions);

  // Calculate asset allocation percentages
  const totalAssets = summaryData.total_deposits || 1;
  const savingsAccount = deposits.find((d) => d.type === "Savings");
  const cdAccount = deposits.find((d) => d.type === "CD");
  const checkingAccount = deposits.find((d) => d.type === "DDA");

  const savingsPct = savingsAccount
    ? Math.round((savingsAccount.balance / totalAssets) * 100)
    : 57;
  const cdPct = cdAccount
    ? Math.round((cdAccount.balance / totalAssets) * 100)
    : 34;
  const checkingPct = checkingAccount
    ? Math.round((checkingAccount.balance / totalAssets) * 100)
    : 9;

  return (
    <AppLayout
      userProfile={customer_profile}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-headline-lg text-on-surface">
            Good morning, {customer_profile.first_name}{" "}
            {customer_profile.last_name}
          </h1>
          <p className="font-body-md text-secondary mt-1">{currentDateStr}</p>
        </div>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Assets"
          value={`$${summaryData.total_deposits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="account_balance_wallet"
          badge="+2.4%"
        />
        <StatCard
          title="Total Liabilities"
          value={`$${(summaryData.total_loans + summaryData.total_mortgages).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="credit_card"
          subtext="Includes mortgage"
          isNegative={true}
        />
        <StatCard
          title="Net Worth"
          value={`$${summaryData.net_worth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="monitoring"
          subtext="Reflects home equity"
          isNegative={summaryData.net_worth < 0}
        />
      </div>

      {/* Row 2: Deposits & Mortgage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deposit Accounts (8 col) */}
        <div className="lg:col-span-8">
          <DepositAccountsTable
            accounts={filteredDeposits}
            onAccountClick={handleAccountClick}
          />
        </div>

        {/* Mortgage Overview (4 col) */}
        <div className="lg:col-span-4 flex">
          <MortgageOverviewCard
            mortgage={mortgages[0]}
            onViewDetails={handleAccountClick}
          />
        </div>
      </div>

      {/* Row 3: Loans & Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Loan Accounts (6 col) */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-sm text-on-surface">Loan Accounts</h2>
          </div>
          <div className="flex flex-col gap-4">
            {filteredLoans && filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => handleAccountClick("fiserv", loan.id)}
                  className="border border-outline-variant rounded-xl p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined">
                        directions_car
                      </span>
                    </div>
                    <div>
                      <h3 className="font-label-md text-on-surface group-hover:underline">
                        {loan.name}
                      </h3>
                      <p className="font-body-sm text-secondary font-mono">
                        •••• {loan.account_number.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-label-md text-on-surface">
                      $
                      {loan.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="font-body-sm text-secondary">
                      Rate: {loan.interest_rate}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-secondary py-4">
                No loan accounts found.
              </p>
            )}
          </div>
        </div>

        {/* Asset Allocation (6 col) */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
          <h2 className="font-headline-sm text-on-surface mb-6">
            Asset Allocation
          </h2>
          <div className="flex-1 flex items-center justify-center gap-8">
            {/* CSS Donut Chart representation */}
            <div
              className="relative w-32 h-32 rounded-full border-8 border-surface flex items-center justify-center"
              style={{
                background: `conic-gradient(#006194 0% ${savingsPct}%, #00855b ${savingsPct}% ${savingsPct + cdPct}%, #ba1a1a ${savingsPct + cdPct}% 100%)`,
                borderRadius: "50%",
              }}
            >
              <div className="w-24 h-24 bg-surface-container-lowest rounded-full absolute"></div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
                <span className="font-body-sm text-secondary w-20">
                  Savings
                </span>
                <span className="font-label-md text-on-surface">
                  {savingsPct}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-tertiary-container"></div>
                <span className="font-body-sm text-secondary w-20">CD</span>
                <span className="font-label-md text-on-surface">{cdPct}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-error"></div>
                <span className="font-body-sm text-secondary w-20">
                  Checking
                </span>
                <span className="font-label-md text-on-surface">
                  {checkingPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
