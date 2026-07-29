import React from "react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}) {
  return (
    <div className="relative w-full max-w-md">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}
