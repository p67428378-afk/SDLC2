import React from "react";

export default function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  ...props
}) {
  const baseStyle =
    "font-label-md py-2.5 px-4 rounded-xl transition-colors shadow-sm";
  const variants = {
    primary:
      "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container",
    secondary:
      "bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container",
    outline:
      "border border-outline-variant text-secondary hover:bg-surface-container",
    white: "bg-white text-primary hover:bg-surface-container-lowest",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
