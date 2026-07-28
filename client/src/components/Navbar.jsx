import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="hidden md:flex flex-col h-full py-lg fixed left-0 top-0 w-[260px] bg-surface dark:bg-surface border-r border-outline-variant dark:border-outline z-20">
      <div className="px-md mb-xl flex items-center gap-sm">
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold">
          N
        </div>
        <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim">
          Nexus Bank
        </span>
      </div>

      <div className="px-md mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-lg">
            AT
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-sm font-semibold">
              Alex Thompson
            </div>
            <div className="font-body-sm text-body-sm text-xs text-on-surface-variant">
              Premium Account
            </div>
          </div>
        </div>
      </div>

      <ul className="flex flex-col flex-1 px-sm gap-xs">
        <li>
          <button
            onClick={() => navigate("/")}
            className={`w-full flex items-center gap-md p-md hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors rounded text-left ${
              isActive("/")
                ? "bg-surface-container-low dark:bg-surface-container-high border-l-4 border-primary dark:border-primary-fixed-dim text-primary font-medium"
                : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined">account_balance</span>
            <span>Mortgage Details</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => navigate("/make-payment")}
            className={`w-full flex items-center gap-md p-md hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors rounded text-left ${
              isActive("/make-payment")
                ? "bg-surface-container-low dark:bg-surface-container-high border-l-4 border-primary dark:border-primary-fixed-dim text-primary font-medium"
                : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined">payments</span>
            <span>Make Payment</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => navigate("/scheduled-payments")}
            className={`w-full flex items-center gap-md p-md hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors rounded text-left ${
              isActive("/scheduled-payments")
                ? "bg-surface-container-low dark:bg-surface-container-high border-l-4 border-primary dark:border-primary-fixed-dim text-primary font-medium"
                : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Scheduled Payments</span>
          </button>
        </li>
      </ul>

      <div className="mt-auto px-sm flex flex-col gap-xs border-t border-outline-variant pt-sm">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-md text-on-surface-variant p-md hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors rounded text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
