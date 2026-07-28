import React from "react";

export default function Badge({ children, variant = "active" }) {
  const styles = {
    active: "bg-secondary/10 text-secondary border border-secondary/20",
    due: "bg-tertiary/10 text-tertiary border border-tertiary/20",
    inactive:
      "bg-outline-variant/10 text-on-surface-variant border border-outline-variant/20",
    error: "bg-error/10 text-error border border-error/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[variant] || styles.active}`}
    >
      {children}
    </span>
  );
}
