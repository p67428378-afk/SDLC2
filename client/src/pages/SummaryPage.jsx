import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { dashboardService } from "../services/api";
import AccountTable from "../components/dashboard/AccountTable";

const SummaryPage = () => {
  const context = useOutletContext() || {};
  const { scenarioKey = 0 } = context;
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await dashboardService.getDashboard();
        setAccounts(res.accounts || []);
      } catch (err) {
        console.error("Error fetching accounts summary:", err);
        setError("Failed to load account summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [scenarioKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-headline-sm text-on-surface-variant animate-pulse">
          Loading account summary...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 text-error p-lg rounded-xl text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="card-surface rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant bg-surface-container-low/50">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Account Summary
          </h3>
          <p className="font-label-md text-label-md text-on-surface-variant mt-1">
            Detailed list of all your aggregated accounts from Fiserv and
            Cenlar.
          </p>
        </div>
        <AccountTable accounts={accounts} />
      </div>
    </div>
  );
};

export default SummaryPage;
