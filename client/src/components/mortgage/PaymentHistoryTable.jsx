import React from "react";
import Badge from "../common/Badge";

export default function PaymentHistoryTable({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        No payment history found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h4 className="text-lg font-bold text-slate-800">
          Recent Payment History
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Description
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Confirmation #
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                Amount
              </th>
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {history.map((payment, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-4 px-6 whitespace-nowrap font-medium">
                  {payment.date}
                </td>
                <td className="py-4 px-6">{payment.description}</td>
                <td className="py-4 px-6 font-mono text-xs text-slate-500">
                  {payment.confirmationNumber}
                </td>
                <td className="py-4 px-6 text-right font-semibold text-slate-900">
                  $
                  {payment.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="py-4 px-6 text-center">
                  <Badge
                    variant={
                      payment.status === "COMPLETED" ||
                      payment.status === "Posted"
                        ? "success"
                        : "danger"
                    }
                  >
                    {payment.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
