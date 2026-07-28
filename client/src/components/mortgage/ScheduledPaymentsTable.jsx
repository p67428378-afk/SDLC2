import React from "react";
import PropTypes from "prop-types";

export default function ScheduledPaymentsTable({ payments }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-xs px-2 py-1 bg-[#EFF6FF] text-[#1E40AF] rounded-full font-label-md text-[11px] uppercase tracking-wide border border-[#DBEAFE]">
            <span className="material-symbols-outlined text-[14px]">
              schedule
            </span>
            Scheduled
          </span>
        );
      case "PROCESSED":
        return (
          <span className="inline-flex items-center gap-xs px-2 py-1 bg-[#F0FDF4] text-[#166534] rounded-full font-label-md text-[11px] uppercase tracking-wide border border-[#DCFCE7]">
            <span className="material-symbols-outlined text-[14px]">
              check_circle
            </span>
            Processed
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-xs px-2 py-1 bg-[#FEF2F2] text-[#991B1B] rounded-full font-label-md text-[11px] uppercase tracking-wide border border-[#FEE2E2]">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-xs px-2 py-1 bg-surface-variant text-on-surface-variant rounded-full font-label-md text-[11px] uppercase tracking-wide border border-outline-variant">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Scheduled Payments
        </h2>
      </div>
      <div className="overflow-x-auto">
        {payments.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant font-body-md">
            No scheduled payments found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Payment ID
                </th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Payment Date
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
              {payments.map((payment) => (
                <tr
                  key={payment.paymentId}
                  className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors group cursor-default"
                >
                  <td className="p-md whitespace-nowrap">
                    {payment.paymentId}
                  </td>
                  <td className="p-md whitespace-nowrap">
                    {payment.paymentDate}
                  </td>
                  <td className="p-md text-right font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="p-md text-center">
                    {getStatusBadge(payment.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

ScheduledPaymentsTable.propTypes = {
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      paymentId: PropTypes.string.isRequired,
      paymentDate: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
    }),
  ).isRequired,
};
