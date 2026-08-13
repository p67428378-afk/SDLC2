import React from "react";
import Sidebar from "./components/layout/Sidebar.jsx";
import Header from "./components/layout/Header.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

export default function App() {
  return (
    <div className="w-full min-h-screen flex bg-background text-on-background font-body-md">
      {/* SideNavBar */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        {/* TopAppBar */}
        <Header />

        {/* Canvas / Main Content */}
        <DashboardPage />
      </div>
    </div>
  );
}
