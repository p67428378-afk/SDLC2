import React from "react";

export default function Header({ onSearchChange, searchQuery }) {
  return (
    <header className="h-[64px] bg-card-background border-b border-border flex justify-between items-center px-6 sticky top-0 z-40">
      {/* Search */}
      <div className="relative w-96">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          search
        </span>
        <input
          type="text"
          value={searchQuery || ""}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-page-background border border-border rounded-xl text-body-sm focus:border-focus-ring focus:ring-1 focus:ring-focus-ring outline-none transition-all"
          placeholder="Search accounts or transactions..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-text-secondary hover:bg-page-background rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-card-background"></span>
        </button>
        <button className="p-2 text-text-secondary hover:bg-page-background rounded-full transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}
