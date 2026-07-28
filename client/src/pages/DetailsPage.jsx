import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { accountsService, dashboardService } from "../services/api";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";

export default function DetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [accountsList, setAccountsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        if (id) {
          const data = await accountsService.getAccountDetails(id);
          setAccount(data);
        } else {
          const data = await dashboardService.getDashboard();
          setAccountsList(data.accounts);
        }
      } catch (err) {
        setError(
          err.response?.data?.detail || "Failed to load account details.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (loading) {
    return (
      <AppLayout title="Account Details" subtitle="Loading details...">
        <div className="flex justify-center items-center h-64">
          <span className="text-primary font-semibold">Loading details...</span>
        </div>
      </AppLayout>
    );
  }

  if (!id) {
    return (
      <AppLayout
        title="Account Details"
        subtitle="Select an account to view details"
      >
        <div className="flex flex-col gap-md">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Select an Account
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {accountsList.map((acc) => (
              <div
                key={acc.id}
                onClick={() => navigate(`/details/${acc.id}`)}
                className="card-surface rounded-xl p-md flex flex-col justify-between h-[140px] cursor-pointer hover:border-primary transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-body-lg text-body-lg font-semibold text-on-surface">
                      {acc.name}
                    </h4>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      {acc.institution}
                    </p>
                  </div>
                  <Badge
                    variant={
                      acc.status.toLowerCase() === "active" ? "active" : "due"
                    }
                  >
                    {acc.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-end mt-md">
                  <span className="font-body-md text-on-surface font-mono">
                    {acc.accountNumber}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Account Details"
      subtitle={`${account?.name || "Account"} Details`}
    >
      {error && (
        <div
          className="p-sm bg-error/10 border border-error/20 text-error rounded-lg text-body-md font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      {account && (
        <div className="flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              <span className="material-symbols-outlined text-[18px] mr-1 align-middle">
                arrow_back
              </span>
              Back to Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
            {/* Left Column: Account Info */}
            <div className="lg:col-span-4 flex flex-col gap-md">
              <div className="card-surface rounded-xl p-md flex flex-col gap-md">
                <div className="flex justify-between items-start border-b border-outline-variant pb-xs">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {account.name}
                    </h3>
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

                <div className="flex flex-col gap-sm">
                  <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      Account Number
                    </p>
                    <p className="font-body-lg text-body-lg text-on-surface font-mono font-semibold">
                      {account.accountNumber}
                    </p>
                  </div>

                  <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      Current Balance
                    </p>
                    <p className="font-headline-lg text-headline-lg text-primary font-bold">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>

                  <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      Account Type
                    </p>
                    <p className="font-body-md text-on-surface font-semibold">
                      {account.type}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Details / Transactions / Loan Info */}
            <div className="lg:col-span-8 flex flex-col gap-md">
              <div className="card-surface rounded-xl p-md flex flex-col gap-md">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface border-b border-outline-variant pb-xs">
                  {account.type.toLowerCase().includes("mortgage")
                    ? "Mortgage & Escrow Details"
                    : "Account Details"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {Object.entries(account.details || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-sm bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center"
                    >
                      <span className="font-label-md text-label-md text-on-surface-variant capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="font-body-md text-on-surface font-semibold">
                        {typeof val === "number" &&
                        !key.toLowerCase().includes("rate")
                          ? formatCurrency(val)
                          : String(val)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mock Transactions for non-mortgage accounts */}
                {!account.type.toLowerCase().includes("mortgage") && (
                  <div className="mt-md flex flex-col gap-sm">
                    <h4 className="font-body-lg text-body-lg font-semibold text-on-surface">
                      Recent Transactions
                    </h4>
                    <div className="flex flex-col gap-xs">
                      <div className="p-sm bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                        <div>
                          <p className="font-body-md text-on-surface font-semibold">
                            Payroll Direct Deposit
                          </p>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            July 25, 2026
                          </p>
                        </div>
                        <span className="font-body-lg text-body-lg text-secondary font-bold">
                          +$4,500.00
                        </span>
                      </div>
                      <div className="p-sm bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                        <div>
                          <p className="font-body-md text-on-surface font-semibold">
                            Apex Grocery Store
                          </p>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            July 24, 2026
                          </p>
                        </div>
                        <span className="font-body-lg text-body-lg text-error font-bold">
                          -$124.50
                        </span>
                      </div>
                      <div className="p-sm bg-surface-container-low rounded-lg border border-outline-variant flex justify-between items-center">
                        <div>
                          <p className="font-body-md text-on-surface font-semibold">
                            Online Transfer
                          </p>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            July 22, 2026
                          </p>
                        </div>
                        <span className="font-body-lg text-body-lg text-error font-bold">
                          -$50.00
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
