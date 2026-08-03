import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authService } from "../../services/api";

export default function Sidebar({ userProfile }) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    authService.logout();
    navigate("/login");
  };

  const initials = userProfile
    ? `${userProfile.first_name?.[0] || ""}${userProfile.last_name?.[0] || ""}`.toUpperCase()
    : "JD";

  const fullName = userProfile
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : "Jane Doe";

  const cif = userProfile ? userProfile.cif : "CIF-982341";

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-secondary text-white border-r border-border flex flex-col z-50">
      {/* Brand */}
      <div className="px-6 py-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">
            account_balance
          </span>
          <span className="font-headline-sm text-white tracking-tight">
            TFS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-r-xl transition-colors duration-200 ${
              isActive
                ? "bg-primary text-white border-l-4 border-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            dashboard
          </span>
          <span className="font-label-md">Dashboard</span>
        </NavLink>

        <NavLink
          to="/summary"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-r-xl transition-colors duration-200 ${
              isActive
                ? "bg-primary text-white border-l-4 border-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <span className="material-symbols-outlined">account_balance</span>
          <span className="font-label-md">Account Summary</span>
        </NavLink>

        <NavLink
          to="/relationship"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-r-xl transition-colors duration-200 ${
              isActive
                ? "bg-primary text-white border-l-4 border-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <span className="material-symbols-outlined">hub</span>
          <span className="font-label-md">Relationship Overview</span>
        </NavLink>

        <NavLink
          to="/details"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-r-xl transition-colors duration-200 ${
              isActive
                ? "bg-primary text-white border-l-4 border-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-label-md">Account Details</span>
        </NavLink>

        <NavLink
          to="/scheduled-payments"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-r-xl transition-colors duration-200 ${
              isActive
                ? "bg-primary text-white border-l-4 border-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="font-label-md">Scheduled Payments</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-r-xl transition-colors duration-200 ${
              isActive
                ? "bg-primary text-white border-l-4 border-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md">Profile Settings</span>
        </NavLink>
      </nav>

      {/* CTA & Footer */}
      <div className="p-4 border-t border-white/10">
        <button className="w-full bg-primary text-white font-label-md py-2.5 px-4 rounded-xl mb-4 hover:bg-red-700 transition-colors shadow-sm">
          Open New Account
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-headline-sm">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-label-md text-white">{fullName}</span>
            <span className="font-label-sm text-gray-300">{cif}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <a
            href="#support"
            className="flex items-center gap-3 text-gray-300 px-2 py-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-sm">help</span>
            <span className="font-label-sm">Support</span>
          </a>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 text-gray-300 px-2 py-2 hover:bg-white/10 rounded-xl transition-colors duration-200 text-left"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="font-label-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
