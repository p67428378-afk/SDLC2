import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authService } from "../../services/api";

const Sidebar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] bg-surface-container-low border-r border-outline-variant flex flex-col py-lg px-md z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-sm mb-xl">
        <img
          alt="ApexUnion Corporate Logo"
          className="h-8 w-auto"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTsqgxUVd6QDHUTIsDOVc0V8Y8UECTiji-VEibmd7iJrfSGBVLbQ7PB89vYnyVKSL7JrpPE-S_5KbE0PYmeP3K9_iXJ3GzM16cE4Jtziv-ysy7iAiI0hjAw3snEK668WEkMeSkJISrC4QWTF2pD-71vVZwXB4AXNOqsZH8GUsdGU9Gm08TuuaYOFJ8fhzkO6VUlG-20BHZ1xETKHCj8Y34yCB9Wf6mfmXPTN2SWypm7ViuVLCBqIXGiPlWfgxy7vbpbb7zoIrq-TkI"
        />
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            ApexUnion
          </h1>
          <p className="font-label-md text-label-md text-on-surface-variant">
            Wealth Management
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-xs flex-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-sm px-sm py-[12px] rounded-r-lg duration-200 ease-in-out ${
              isActive
                ? "text-primary font-bold border-l-4 border-primary bg-primary/10"
                : "text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg"
            }`
          }
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            dashboard
          </span>
          Dashboard
        </NavLink>

        <NavLink
          to="/summary"
          className={({ isActive }) =>
            `flex items-center gap-sm px-sm py-[12px] rounded-r-lg duration-200 ease-in-out ${
              isActive
                ? "text-primary font-bold border-l-4 border-primary bg-primary/10"
                : "text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg"
            }`
          }
        >
          <span className="material-symbols-outlined">
            account_balance_wallet
          </span>
          Account Summary
        </NavLink>

        <NavLink
          to="/relationships"
          className={({ isActive }) =>
            `flex items-center gap-sm px-sm py-[12px] rounded-r-lg duration-200 ease-in-out ${
              isActive
                ? "text-primary font-bold border-l-4 border-primary bg-primary/10"
                : "text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg"
            }`
          }
        >
          <span className="material-symbols-outlined">account_tree</span>
          Relationship Overview
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-sm px-sm py-[12px] text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg duration-200 ease-in-out text-left w-full"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>

      {/* User Profile Bottom */}
      <div className="mt-auto pt-md border-t border-outline-variant flex items-center gap-sm">
        <img
          className="w-10 h-10 rounded-full object-cover border border-outline-variant"
          alt="User Profile"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkc3XW7ipDTKyDMCL-msCByi7kfVYNinRTpD-KGTD0jBq5_bTVeGUtNHyJVuBSwnBL9-Fyuazw9eUzfeGBUE06kUqto-e6BBK1jkSD1EBPXDd9u8DmNVVdL3xfZ6fCsEP-gkfYfpxQyG5vNvCY4bsvLYqVVMAaJJ0Isir4mEm24g_R6m-42lZ-ACw4fU8KlJSZSizeIl9IscpldPlg5DiRQ40HWkQ7-4KR6pamUYFcPyO7nzy0-PWp01pRp_KlepTkciJd2_STCodv"
        />
        <div>
          <p className="font-body-md text-on-surface font-semibold">
            {user?.username || "John Doe"}
          </p>
          <p className="font-label-md text-on-surface-variant">CIF-98421</p>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
