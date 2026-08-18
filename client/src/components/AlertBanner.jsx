import React from "react";
import { AlertTriangle, XCircle, CheckCircle, Info, X } from "lucide-react";

export default function AlertBanner({ type = "error", message, onClose }) {
  if (!message) return null;

  const styles = {
    error: {
      bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200",
      icon: (
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
      ),
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200",
      icon: (
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      ),
    },
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200",
      icon: (
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      ),
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-200",
      icon: (
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      ),
    },
  };

  const currentStyle = styles[type] || styles.error;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between p-4 rounded-xl border ${currentStyle.bg} transition-all mb-4 shadow-sm`}
    >
      <div className="flex items-start space-x-3">
        {currentStyle.icon}
        <div className="text-sm font-medium leading-5">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
