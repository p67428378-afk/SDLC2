import React from "react";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
}) => {
  const baseStyles =
    "px-sm py-xs rounded-lg font-semibold transition-all duration-200 ease-in-out scale-95 active:scale-90 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-container",
    secondary: "bg-secondary text-on-secondary hover:bg-secondary-container",
    outline:
      "border border-outline-variant text-on-surface hover:bg-surface-container-high",
    danger: "bg-error text-on-error hover:bg-error-container",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
