import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { accountService } from "../services/api";
import Badge from "../components/common/Badge";

const DetailsPage = () => {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAccountDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await accountService.getAccountDetails(accountId);
        setAccount(res);
      } catch (err) {
        console.error("Error fetching account details:", err);
        setError(
          err.response?.data?.detail || "Failed to load account details.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchAccountDetails();
    }
  }, [accountId]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (s === "active") return "active";
    if (s === "payment due" || s === "delinquent") return "delinquent";
    return "inactive";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-headline-sm text-on-surface-variant animate-pulse">
          Loading account details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-md">
        <div className="bg-error/10 border border-error/20 text-error p-lg rounded-xl flex flex-col gap-sm">
          <h3 className="font-headline-sm text-headline-sm font-bold flex items-center gap-xs">
            <span className="material-symbols-outlined text-error">error</span>
            Error Loading Account
          </h3>
          <p className="font-body-lg text-body-lg">{error}</p>
          <Link
            to="/"
            className="self-start px-sm py-xs bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-xl text-center text-on-surface-variant font-body-lg">
        Account not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center gap-xs">
        <Link
          to="/"
          className="text-primary hover:underline flex items-center font-label-md text-label-md uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[16px] mr-1">
            arrow_back
          </span>
          Back to Dashboard
        </Link>
      </div>

      <div className="card-surface rounded-xl p-lg flex flex-col gap-md">
        <div className="flex justify-between items-start border-b border-outline-variant pb-md">
          <div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
              {account.name}
            </h3>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">
              {account.institution} &bull; Account Number:{" "}
              {account.accountNumber}
            </p>
          </div>
          <Badge variant={getStatusVariant(account.status)}>
            {account.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md py-md">
          <div className="flex flex-col gap-xs">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Current Balance
            </span>
            <span className="font-headline-lg text-headline-lg text-on-surface">
              {formatCurrency(account.balance)}
            </span>
          </div>

          <div className="flex flex-col gap-xs">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Account Type
            </span>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface capitalize">
              {account.type}
            </span>
          </div>
        </div>

        {account.details && Object.keys(account.details).length > 0 && (
          <div className="border-t border-outline-variant pt-md">
            <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-sm">
              Additional Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm bg-surface-container-low p-md rounded-xl border border-outline-variant">
              {Object.entries(account.details).map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between border-b border-outline-variant/50 pb-xs last:border-none last:pb-0"
                >
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="font-body-md text-on-surface font-medium">
                    {typeof val === "number" &&
                    key.toLowerCase().includes("balance")
                      ? formatCurrency(val)
                      : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsPage;
