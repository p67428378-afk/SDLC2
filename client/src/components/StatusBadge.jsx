import React from "react";

export const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || "").toUpperCase();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  switch (normalizedStatus) {
    case "COMPLETED":
    case "SUCCEEDED":
    case "SUCCESS":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
      dotColor = "bg-emerald-500";
      break;
    case "REFUNDED":
      styles = "bg-purple-50 text-purple-700 border-purple-200";
      dotColor = "bg-purple-500";
      break;
    case "PARTIALLY_REFUNDED":
    case "PARTIAL_REFUND":
      styles = "bg-indigo-50 text-indigo-700 border-indigo-200";
      dotColor = "bg-indigo-500";
      break;
    case "FAILED":
    case "CANCELLED":
      styles = "bg-rose-50 text-rose-700 border-rose-200";
      dotColor = "bg-rose-500";
      break;
    case "PENDING":
    case "PROCESSING":
      styles = "bg-amber-50 text-amber-700 border-amber-200";
      dotColor = "bg-amber-500";
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {normalizedStatus || "UNKNOWN"}
    </span>
  );
};

export default StatusBadge;
