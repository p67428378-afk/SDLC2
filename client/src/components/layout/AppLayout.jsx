import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({
  children,
  userProfile,
  onSearchChange,
  searchQuery,
}) {
  return (
    <div className="min-h-screen flex bg-background text-on-background font-body-md">
      <Sidebar userProfile={userProfile} />
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        <Header onSearchChange={onSearchChange} searchQuery={searchQuery} />
        <main className="flex-1 p-6 md:p-8 flex flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
