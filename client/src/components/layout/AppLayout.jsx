import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { authService } from "../../services/api";

const AppLayout = () => {
  const [scenarioKey, setScenarioKey] = useState(0);

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const handleScenarioChange = () => {
    // Increment key to force re-render or trigger data refetch in child components
    setScenarioKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex bg-[#0b1326] text-[#dae2fd]">
      <Sidebar />
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        <Header onScenarioChange={handleScenarioChange} />
        <main className="flex-1 mt-[64px] p-xl overflow-y-auto">
          <div className="max-w-[1440px] mx-auto flex flex-col gap-md">
            <Outlet context={{ scenarioKey }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
