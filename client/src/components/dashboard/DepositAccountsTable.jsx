import React from "react";

export default function DepositAccountsTable({ accounts, onAccountClick }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-sm overflow-hidden">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center">
        <h2 className="font-headline-sm text-on-surface">Deposit Accounts</h2>
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
            {accounts && accounts.length > 0 ? (
              accounts.map((account) => (
                <tr
                  key={account.id}
                  onClick={() =>
                    onAccountClick && onAccountClick("fiserv", account.id)
                  }
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
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
  );
}
