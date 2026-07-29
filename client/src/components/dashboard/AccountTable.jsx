import React from "react";
import { Link } from "react-router-dom";
import Badge from "../common/Badge";

const AccountTable = ({ accounts = [] }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase();
    if (s === "active") return "active";
    if (s === "payment due" || s === "delinquent") return "delinquent";
    return "inactive";
  };

  if (accounts.length === 0) {
    return (
      <div className="p-xl text-center text-on-surface-variant font-body-lg">
        No accounts found.
      </div>
    );
  }

  return (
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
          </tr>
        </thead>
        <tbody className="font-body-md">
          {accounts.map((account) => (
            <tr
              key={account.id}
              className="border-b border-outline-variant hover:bg-surface-container-high/50 transition-colors group"
            >
              <td className="p-md font-medium text-on-surface group-hover:text-primary transition-colors">
                <Link
                  to={`/accounts/${account.id}`}
                  className="hover:underline block"
                >
                  {account.name}
                </Link>
              </td>
              <td className="p-md text-on-surface-variant">
                {account.institution}
              </td>
              <td className="p-md text-on-surface-variant">{account.type}</td>
              <td className="p-md text-right font-medium text-on-surface">
                {formatCurrency(account.balance)}
              </td>
              <td className="p-md text-right">
                <Badge variant={getStatusVariant(account.status)}>
                  {account.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountTable;
