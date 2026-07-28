import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  CalendarRange,
  LogOut,
  Home,
} from "lucide-react";
import { authService } from "../../services/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/mortgage/MTG-88492", label: "Mortgage Details", icon: Home },
    { to: "/make-payment", label: "Make Payment", icon: CreditCard },
    {
      to: "/scheduled-payments",
      label: "Scheduled Payments",
      icon: CalendarRange,
    },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-slate-300 shadow-md flex flex-col py-6 z-50">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <div>
            <h1 className="font-semibold text-lg text-white leading-tight">
              Apex Bank
            </h1>
            <p className="text-xs text-slate-400">Online Banking</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      <div className="px-3 mt-auto">
        {user && (
          <div className="px-4 py-3 mb-4 bg-slate-800/50 rounded-lg border border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Logged In As
            </p>
            <p className="text-sm font-medium text-white truncate">
              {user.username}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
