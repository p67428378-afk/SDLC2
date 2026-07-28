import React from "react";
import { Calendar, Trash2, Edit2 } from "lucide-react";
import Badge from "../common/Badge";
import Button from "../common/Button";

export default function ScheduledPaymentsTable({
  payments,
  accounts,
  onEdit,
  onDelete,
}) {
  if (!payments || payments.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        No scheduled payments found.
      </div>
    );
  }

  const getAccountName = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc
      ? `${acc.accountName} (•••• ${acc.maskedAccountNumber.slice(-4)})`
      : "Unknown Account";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Frequency
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Source Account
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                Amount
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                Status
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-4 px-6 whitespace-nowrap font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {payment.startDate}
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {payment.endDate || "No End Date"}
                </td>
                <td className="py-4 px-6">
                  <span className="capitalize font-medium">
                    {payment.frequency.toLowerCase()}
                  </span>
                </td>
                <td className="py-4 px-6">
                  {getAccountName(payment.sourceAccountId)}
                </td>
                <td className="py-4 px-6 text-right font-semibold text-slate-900">
                  $
                  {payment.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="py-4 px-6 text-center">
                  <Badge variant={payment.isActive ? "success" : "neutral"}>
                    {payment.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(payment)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit Scheduled Payment"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(payment.id)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel Scheduled Payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
