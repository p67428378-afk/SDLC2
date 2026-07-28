import React, { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import KPICard from "../components/dashboard/KPICard";
import AccountTable from "../components/dashboard/AccountTable";
import AllocationChart from "../components/dashboard/AllocationChart";
import { dashboardService, mockService } from "../services/api";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scenario, setScenario] = useState("default");
  const [scenarioStatus, setScenarioStatus] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleScenarioChange = async (newScenario) => {
    setScenario(newScenario);
    setScenarioStatus("Configuring...");
    try {
      await mockService.configureMock(newScenario);
      setScenarioStatus(`Configured: ${newScenario}`);
      fetchDashboardData();
    } catch (err) {
      setScenarioStatus("Failed to configure scenario");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <AppLayout
      title="Unified Dashboard"
      subtitle="Aggregated view of all accounts"
    >
      {/* Scenario Injector for QA */}
      <div className="card-surface rounded-xl p-md flex flex-col md:flex-row justify-between items-center gap-md bg-surface-container-low/50">
        <div>
          <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            QA Scenario Injector
          </h4>
          <p className="font-label-md text-label-md text-on-surface-variant">
            Configure mock responses for Fiserv & Cenlar APIs
          </p>
        </div>
        <div className="flex items-center gap-sm flex-wrap">
          <select
            value={scenario}
            onChange={(e) => handleScenarioChange(e.target.value)}
            className="input-surface rounded-lg px-sm py-xs text-on-surface bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <option value="default" className="bg-[#0b1326]">
              Default (Valid Customer)
            </option>
            <option value="no_accounts" className="bg-[#0b1326]">
              No Accounts
            </option>
            <option value="multiple_accounts" className="bg-[#0b1326]">
              Multiple Accounts
            </option>
            <option value="delinquent" className="bg-[#0b1326]">
              Delinquent Mortgage
            </option>
            <option value="error_states" className="bg-[#0b1326]">
              API Error States
            </option>
          </select>
          {scenarioStatus && (
            <span className="font-label-md text-label-md text-primary bg-primary/10 px-2 py-1 rounded-full">
              {scenarioStatus}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          className="p-sm bg-error/10 border border-error/20 text-error rounded-lg text-body-md font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="text-primary font-semibold">
            Loading dashboard data...
          </span>
        </div>
      ) : dashboardData ? (
        <>
          {/* Row 1: KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <KPICard
              title="Total Net Worth"
              value={formatCurrency(dashboardData.netWorth)}
              icon="account_balance"
              trend="+4.2%"
              trendUp={true}
            />
            <KPICard
              title="Total Deposits (Fiserv)"
              value={formatCurrency(dashboardData.totalDeposits)}
              icon="savings"
            />
            <KPICard
              title="Total Mortgage (Cenlar)"
              value={formatCurrency(dashboardData.totalMortgage)}
              icon="home_work"
              trend={scenario === "delinquent" ? "Delinquent" : undefined}
              trendUp={false}
            />
          </div>

          {/* Row 2: Large Data Table Card */}
          <AccountTable accounts={dashboardData.accounts} />

          {/* Row 3: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
            {/* Area Chart (8-col) */}
            <div className="lg:col-span-8 card-surface rounded-xl p-md flex flex-col h-[320px]">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-md">
                Asset vs. Liability Trend
              </h3>
              <div className="flex-1 w-full relative">
                <svg
                  className="w-full h-full"
                  preserveAspectRatio="none"
                  viewBox="0 0 600 200"
                >
                  <defs>
                    <linearGradient
                      id="indigo-gradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8083ff"
                        stopOpacity="0.4"
                      ></stop>
                      <stop
                        offset="100%"
                        stopColor="#8083ff"
                        stopOpacity="0"
                      ></stop>
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line
                    className="chart-grid"
                    x1="0"
                    x2="600"
                    y1="50"
                    y2="50"
                  ></line>
                  <line
                    className="chart-grid"
                    x1="0"
                    x2="600"
                    y1="100"
                    y2="100"
                  ></line>
                  <line
                    className="chart-grid"
                    x1="0"
                    x2="600"
                    y1="150"
                    y2="150"
                  ></line>
                  <line
                    className="chart-grid"
                    x1="0"
                    x2="600"
                    y1="200"
                    y2="200"
                  ></line>
                  {/* X Axis Labels */}
                  <text className="chart-text" x="0" y="195">
                    Jan
                  </text>
                  <text className="chart-text" x="120" y="195">
                    Feb
                  </text>
                  <text className="chart-text" x="240" y="195">
                    Mar
                  </text>
                  <text className="chart-text" x="360" y="195">
                    Apr
                  </text>
                  <text className="chart-text" x="480" y="195">
                    May
                  </text>
                  <text className="chart-text" x="580" y="195">
                    Jun
                  </text>
                  {/* Asset Area & Line */}
                  <path
                    className="chart-area"
                    d="M0,200 L0,120 C100,110 150,90 240,100 C330,110 400,60 480,50 C540,40 580,20 600,10 L600,200 Z"
                  ></path>
                  <path
                    className="chart-line"
                    d="M0,120 C100,110 150,90 240,100 C330,110 400,60 480,50 C540,40 580,20 600,10"
                  ></path>
                  {/* Liability Line (dashed) */}
                  <path
                    d="M0,180 L120,175 L240,170 L360,165 L480,160 L600,150"
                    fill="none"
                    stroke="#908fa0"
                    strokeDashArray="4 4"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
            </div>

            {/* Donut Chart (4-col) */}
            <div className="lg:col-span-4">
              <AllocationChart accounts={dashboardData.accounts} />
            </div>
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}
