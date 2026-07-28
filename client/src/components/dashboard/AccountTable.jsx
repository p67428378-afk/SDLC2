import React from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../common/Badge";

export default function AccountTable({ accounts }) {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStatusVariant = (status) => {
    const s = status.toLowerCase();
    if (s === "active") return "active";
    if (s === "payment due" || s === "delinquent") return "due";
    return "inactive";
  };

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          Your Aggregated Accounts
        </h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/20 border-b border-outline-variant">
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Account Name
              </th>
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Institution
              </th>
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Type
              </th>
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">
                Balance
              </th>
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">
                Status
              </th>
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="font-body-md">
            {accounts.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-md text-center text-on-surface-variant"
                >
                  No accounts found.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-outline-variant hover:bg-surface-container-high/50 transition-colors group"
                >
                  <td className="p-md font-medium text-on-surface group-hover:text-primary transition-colors">
                    {account.name}
                  </td>
                  <td className="p-md text-on-surface-variant">
                    {account.institution}
                  </td>
                  <td className="p-md text-on-surface-variant">
                    {account.type}
                  </td>
                  <td className="p-md text-right font-medium text-on-surface">
                    {formatCurrency(account.balance)}
                  </td>
                  <td className="p-md text-right">
                    <Badge variant={getStatusVariant(account.status)}>
                      {account.status}
                    </Badge>
                  </td>
                  <td className="p-md text-center">
                    <button
                      onClick={() => navigate(`/details/${account.id}`)}
                      className="text-primary hover:text-primary-container font-label-md text-label-md inline-flex items-center transition-colors"
                    >
                      Details{" "}
                      <span className="material-symbols-outlined text-[16px] ml-1">
                        arrow_forward
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
