import React, { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { dashboardService } from "../services/api";
import Badge from "../components/common/Badge";

export default function SummaryPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await dashboardService.getDashboard();
        setAccounts(data.accounts);
      } catch (err) {
        setError("Failed to load account summary.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {});

  return (
    <AppLayout
      title="Account Summary"
      subtitle="Detailed breakdown by account type"
    >
      {error && (
        <div
          className="p-sm bg-error/10 border border-error/20 text-error rounded-lg text-body-md font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="text-primary font-semibold">
            Loading account summary...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-lg">
          {Object.keys(groupedAccounts).length === 0 ? (
            <div className="card-surface rounded-xl p-md text-center text-on-surface-variant">
              No accounts found.
            </div>
          ) : (
            Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
              <div key={type} className="flex flex-col gap-md">
                <h3 className="font-headline-sm text-headline-sm font-bold text-primary border-b border-outline-variant pb-xs">
                  {type} Accounts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  {typeAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="card-surface rounded-xl p-md flex flex-col justify-between h-[160px]"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-body-lg text-body-lg font-semibold text-on-surface">
                            {account.name}
                          </h4>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            {account.institution}
                          </p>
                        </div>
                        <Badge
                          variant={
                            account.status.toLowerCase() === "active"
                              ? "active"
                              : "due"
                          }
                        >
                          {account.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-end mt-md">
                        <div>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            Account Number
                          </p>
                          <p className="font-body-md text-on-surface font-mono">
                            {account.accountNumber}
                          </p>
                        </div>
                        <span className="font-headline-md text-headline-md text-on-surface font-bold">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AppLayout>
  );
}
