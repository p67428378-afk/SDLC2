import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Header from "./components/layout/Header.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="w-full min-h-screen flex bg-background text-on-background font-body-md">
      {/* SideNavBar */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        {/* TopAppBar */}
        <Header currentPage={currentPage} />

        {/* Canvas / Main Content */}
        {currentPage === "settings" ? <SettingsPage /> : <DashboardPage />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
