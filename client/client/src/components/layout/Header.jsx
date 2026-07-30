import React from "react";

export default function Header({ onSearchChange, searchQuery }) {
  return (
    <header className="h-[64px] bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-6 sticky top-0 z-40">
      {/* Search */}
      <div className="relative w-96">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
          search
        </span>
        <input
          type="text"
          value={searchQuery || ""}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          placeholder="Search accounts or transactions..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest"></span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}
