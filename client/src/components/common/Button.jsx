import React from "react";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  onClick,
  disabled = false,
  className = "",
  ...props
}) {
  const baseStyles =
    "px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:ring-emerald-500",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:ring-slate-500",
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:ring-red-500",
    outline:
      "border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:ring-slate-500",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
