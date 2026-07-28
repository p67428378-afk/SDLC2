import React from "react";
import { Calendar, AlertCircle } from "lucide-react";

export default function ScheduledPaymentsTable({ payments }) {
  if (!payments || payments.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl text-center flex flex-col items-center gap-sm shadow-sm">
        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
          No Scheduled Payments
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
          You don't have any pending scheduled payments at this time. You can
          schedule a payment from the Make Payment screen.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="p-md border-b border-outline-variant bg-surface-bright">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Scheduled Payments
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Payment ID
              </th>
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Scheduled Date
              </th>
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">
                Amount
              </th>
              <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="font-data-mono text-data-mono text-on-surface">
            {payments.map((p) => (
              <tr
                key={p.paymentId}
                className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors group cursor-default"
              >
                <td className="p-md whitespace-nowrap text-sm text-on-surface-variant">
                  {p.paymentId}
                </td>
                <td className="p-md whitespace-nowrap font-body-sm text-body-sm font-medium">
                  {new Date(p.paymentDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>
                <td className="p-md text-right font-medium font-mono">
                  $
                  {p.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="p-md text-center">
                  <span className="inline-flex items-center gap-xs px-2 py-1 bg-surface-container-high text-primary rounded-full font-label-md text-[11px] uppercase tracking-wide border border-outline-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
