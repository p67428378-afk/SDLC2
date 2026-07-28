import React from "react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}) {
  return (
    <div className="input-surface flex items-center px-sm py-xs rounded-lg w-full max-w-md transition-colors">
      <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-xs">
        search
      </span>
      <input
        className="bg-transparent border-none text-body-md text-on-surface focus:outline-none w-full placeholder-on-surface-variant"
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
