import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { dashboardService } from "../services/api";

export default function AccountSummaryPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardService.getDashboard();
        setDashboardData(data);
      } catch (err) {
        setError("Failed to load account summary. Please try again.");
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
          <p className="mt-4 text-secondary">Loading account summary...</p>
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
            Error Loading Summary
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

  const filteredMortgages = mortgages.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.account_number.includes(searchQuery),
  );

  return (
    <AppLayout
      userProfile={customer_profile}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div>
        <h1 className="font-headline-lg text-on-surface">Account Summary</h1>
        <p className="font-body-md text-secondary mt-1">
          Detailed view of all your banking and mortgage accounts grouped by
          type.
        </p>
      </div>

      {/* Deposits Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface">
          <h2 className="font-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              savings
            </span>
            Deposit Accounts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-outline-variant">
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Account Name
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Type
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Account Number
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Interest Rate
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Status
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium text-right">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="font-body-md text-on-surface">
              {filteredDeposits.length > 0 ? (
                filteredDeposits.map((account) => (
                  <tr
                    key={account.id}
                    onClick={() => handleAccountClick("fiserv", account.id)}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6 font-medium text-primary group-hover:underline">
                      {account.name}
                    </td>
                    <td className="py-4 px-6 text-secondary">{account.type}</td>
                    <td className="py-4 px-6 font-mono text-secondary">
                      •••• {account.account_number.slice(-4)}
                    </td>
                    <td className="py-4 px-6 text-secondary">
                      {account.interest_rate}%
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {account.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium">
                      $
                      {account.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-secondary">
                    No deposit accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loans Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface">
          <h2 className="font-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              directions_car
            </span>
            Loan Accounts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-outline-variant">
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Account Name
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Type
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Account Number
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Interest Rate
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Status
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium text-right">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="font-body-md text-on-surface">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((account) => (
                  <tr
                    key={account.id}
                    onClick={() => handleAccountClick("fiserv", account.id)}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6 font-medium text-primary group-hover:underline">
                      {account.name}
                    </td>
                    <td className="py-4 px-6 text-secondary">{account.type}</td>
                    <td className="py-4 px-6 font-mono text-secondary">
                      •••• {account.account_number.slice(-4)}
                    </td>
                    <td className="py-4 px-6 text-secondary">
                      {account.interest_rate}%
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {account.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium">
                      $
                      {account.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-secondary">
                    No loan accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mortgages Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface">
          <h2 className="font-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">home</span>
            Mortgage Accounts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-outline-variant">
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Account Name
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Account Number
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Interest Rate
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Maturity Date
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium">
                  Next Payment
                </th>
                <th className="py-3 px-6 font-label-sm text-secondary font-medium text-right">
                  Principal Balance
                </th>
              </tr>
            </thead>
            <tbody className="font-body-md text-on-surface">
              {filteredMortgages.length > 0 ? (
                filteredMortgages.map((account) => (
                  <tr
                    key={account.id}
                    onClick={() => handleAccountClick("cenlar", account.id)}
                    className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6 font-medium text-primary group-hover:underline">
                      {account.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-secondary">
                      •••• {account.account_number.slice(-4)}
                    </td>
                    <td className="py-4 px-6 text-secondary">
                      {account.interest_rate}%
                    </td>
                    <td className="py-4 px-6 text-secondary">
                      {account.maturity_date}
                    </td>
                    <td className="py-4 px-6 text-secondary">
                      $
                      {account.next_payment_amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      (Due {account.next_payment_due})
                    </td>
                    <td className="py-4 px-6 text-right font-medium">
                      $
                      {account.principal_balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-secondary">
                    No mortgage accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
