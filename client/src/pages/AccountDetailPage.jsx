import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { dashboardService } from "../services/api";

export default function AccountDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source");
  const accountId = searchParams.get("id");

  const [account, setAccount] = useState(null);
  const [allAccounts, setAllAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (source && accountId) {
          const details = await dashboardService.getAccountDetail(
            source,
            accountId,
          );
          setAccount(details);
        } else {
          const dash = await dashboardService.getDashboard();
          setAllAccounts(dash.accounts);
        }
      } catch (err) {
        setError("Failed to load account details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [source, accountId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading account details...</p>
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
            Error Loading Details
          </h2>
          <p className="mt-2 text-secondary">{error}</p>
          <button
            onClick={() => navigate("/details")}
            className="mt-6 bg-primary text-on-primary font-label-md py-2 px-4 rounded-xl hover:bg-primary-container transition-colors"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  // If no specific account is selected, show a list of all accounts to select from
  if (!source || !accountId) {
    const { deposits, loans, mortgages } = allAccounts;
    return (
      <AppLayout>
        <div>
          <h1 className="font-headline-lg text-on-surface">Account Details</h1>
          <p className="font-body-md text-secondary mt-1">
            Select an account below to view its detailed information and
            transaction history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Deposits List */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h2 className="font-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                savings
              </span>
              Deposits
            </h2>
            <div className="space-y-3">
              {deposits.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() =>
                    navigate(`/details?source=fiserv&id=${acc.id}`)
                  }
                  className="p-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <p className="font-label-md text-primary hover:underline">
                    {acc.name}
                  </p>
                  <p className="text-xs text-secondary font-mono">
                    •••• {acc.account_number.slice(-4)}
                  </p>
                  <p className="text-sm font-semibold text-on-surface mt-1">
                    $
                    {acc.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Loans List */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h2 className="font-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                directions_car
              </span>
              Loans
            </h2>
            <div className="space-y-3">
              {loans.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() =>
                    navigate(`/details?source=fiserv&id=${acc.id}`)
                  }
                  className="p-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <p className="font-label-md text-primary hover:underline">
                    {acc.name}
                  </p>
                  <p className="text-xs text-secondary font-mono">
                    •••• {acc.account_number.slice(-4)}
                  </p>
                  <p className="text-sm font-semibold text-on-surface mt-1">
                    $
                    {acc.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mortgages List */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h2 className="font-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                home
              </span>
              Mortgages
            </h2>
            <div className="space-y-3">
              {mortgages.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() =>
                    navigate(`/details?source=cenlar&id=${acc.id}`)
                  }
                  className="p-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <p className="font-label-md text-primary hover:underline">
                    {acc.name}
                  </p>
                  <p className="text-xs text-secondary font-mono">
                    •••• {acc.account_number.slice(-4)}
                  </p>
                  <p className="text-sm font-semibold text-on-surface mt-1">
                    $
                    {acc.principal_balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isMortgage = source === "cenlar";

  return (
    <AppLayout>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline-lg text-on-surface">{account.name}</h1>
          <p className="font-body-md text-secondary mt-1">
            Account Number:{" "}
            <span className="font-mono">{account.account_number}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Account Details Card */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <h2 className="font-headline-sm text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            Account Information
          </h2>
          <div className="space-y-4">
            {isMortgage ? (
              <>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Principal Balance
                  </span>
                  <span className="text-on-surface font-bold">
                    $
                    {account.principal_balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Original Loan Amount
                  </span>
                  <span className="text-on-surface font-semibold">
                    $
                    {account.original_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Interest Rate
                  </span>
                  <span className="text-on-surface font-semibold">
                    {account.interest_rate}%
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">Term</span>
                  <span className="text-on-surface font-semibold">
                    {account.term_months} Months
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Maturity Date
                  </span>
                  <span className="text-on-surface font-semibold">
                    {account.maturity_date}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Escrow Balance
                  </span>
                  <span className="text-on-surface font-semibold">
                    $
                    {account.escrow_balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Next Payment Amount
                  </span>
                  <span className="text-on-surface font-semibold">
                    $
                    {account.next_payment_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary font-medium">
                    Next Payment Due
                  </span>
                  <span className="text-primary font-semibold">
                    {account.next_payment_due}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Current Balance
                  </span>
                  <span className="text-on-surface font-bold">
                    $
                    {account.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Account Type
                  </span>
                  <span className="text-on-surface font-semibold">
                    {account.type}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-secondary font-medium">
                    Interest Rate
                  </span>
                  <span className="text-on-surface font-semibold">
                    {account.interest_rate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary font-medium">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {account.status}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Additional Info / Actions Card */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                shield
              </span>
              Security & Settings
            </h2>
            <p className="text-sm text-secondary mb-6">
              Manage your account preferences, statements, and security
              settings.
            </p>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors flex justify-between items-center">
                <span className="font-label-md text-on-surface">
                  View Statements
                </span>
                <span className="material-symbols-outlined text-secondary">
                  chevron_right
                </span>
              </button>
              <button className="w-full text-left px-4 py-3 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors flex justify-between items-center">
                <span className="font-label-md text-on-surface">
                  Account Alerts
                </span>
                <span className="material-symbols-outlined text-secondary">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-surface-container rounded-xl border border-outline-variant text-xs text-secondary">
            <p className="font-semibold text-on-surface mb-1">Need Help?</p>
            <p>
              Contact our 24/7 support team for assistance with this account.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
