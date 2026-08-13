import React from "react";

export default function Header() {
  const today = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = today.toLocaleDateString("en-US", options);

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-260px)] bg-surface border-b border-outline-variant h-16 px-margin-mobile md:px-margin-desktop flex justify-between items-center z-10">
      <div className="flex flex-col">
        <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
          Time Tracker
        </h2>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {formattedDate}
        </p>
      </div>
      <div className="flex items-center gap-gutter">
        <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-all duration-200">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
        </button>
        <button className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </header>
  );
}
