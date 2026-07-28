import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({
  children,
  title,
  subtitle,
  onSearchChange,
  searchValue,
}) {
  return (
    <div className="min-h-screen flex bg-[#0b1326] text-[#dae2fd] antialiased">
      <Sidebar />
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        <Header
          title={title}
          subtitle={subtitle}
          onSearchChange={onSearchChange}
          searchValue={searchValue}
        />
        <main className="flex-1 mt-[64px] p-xl overflow-y-auto">
          <div className="max-w-[1440px] mx-auto flex flex-col gap-md">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
