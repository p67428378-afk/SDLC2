import React from "react";

export default function Header({
  title,
  subtitle,
  onSearchChange,
  searchValue,
}) {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { username: "John" };

  return (
    <header className="fixed top-0 right-0 h-[64px] left-[260px] bg-surface-dim border-b border-outline-variant flex items-center justify-between px-lg z-10">
      <div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          {title || "Unified Dashboard"}
        </h2>
        <p className="font-label-md text-label-md text-on-surface-variant">
          {subtitle || `Welcome back, ${user.username}`}
        </p>
      </div>
      <div className="flex items-center gap-md">
        {/* Search */}
        {onSearchChange && (
          <div className="input-surface flex items-center px-sm py-xs rounded-lg w-64 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-xs">
              search
            </span>
            <input
              className="bg-transparent border-none text-body-md text-on-surface focus:outline-none w-full placeholder-on-surface-variant"
              placeholder="Search accounts..."
              type="text"
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {/* Actions */}
        <div className="flex items-center gap-xs">
          <button className="relative p-xs text-on-surface-variant hover:text-primary transition-colors scale-95 active:scale-90 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <button className="p-xs text-on-surface-variant hover:text-primary transition-colors scale-95 active:scale-90 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">mail</span>
          </button>
          <button className="p-xs text-on-surface-variant hover:text-primary transition-colors scale-95 active:scale-90 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </div>
    </header>
  );
}
