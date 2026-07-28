import React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

export default function Alert({
  children,
  variant = "info",
  title,
  className = "",
}) {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
    danger: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
  };

  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    danger: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg border ${styles[variant]} ${className}`}
      role="alert"
    >
      {icons[variant]}
      <div>
        {title && <h5 className="font-semibold text-sm mb-1">{title}</h5>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
