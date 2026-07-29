import React from "react";

const Badge = ({ children, variant = "active" }) => {
  const variants = {
    active: "bg-secondary/10 text-secondary border border-secondary/20",
    delinquent: "bg-error/10 text-error border border-error/20",
    pending: "bg-tertiary/10 text-tertiary border border-tertiary/20",
    inactive: "bg-outline/10 text-outline border border-outline/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant] || variants.active}`}
    >
      {children}
    </span>
  );
};

export default Badge;
