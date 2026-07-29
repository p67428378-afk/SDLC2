import React from "react";

export default function Badge({
  children,
  variant = "success",
  className = "",
}) {
  const baseStyle =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm";
  const variants = {
    success: "bg-tertiary-container/10 text-tertiary",
    error: "bg-error-container/10 text-error",
    warning: "bg-yellow-500/10 text-yellow-700",
    info: "bg-primary-container/10 text-primary",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
