import React from "react";

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="input-surface flex items-center px-sm py-xs rounded-lg w-64 transition-colors">
      <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-xs">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-transparent border-none text-body-md text-on-surface focus:outline-none w-full placeholder-on-surface-variant"
      />
    </div>
  );
};

export default SearchBar;
