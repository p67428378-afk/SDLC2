import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { dashboardService } from "../services/api";
import KPICard from "../components/dashboard/KPICard";
import AccountTable from "../components/dashboard/AccountTable";
import AllocationChart from "../components/dashboard/AllocationChart";

const DashboardPage = () => {
  const context = useOutletContext() || {};
  const { scenarioKey = 0 } = context;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardService.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to load dashboard data. Downstream service may be unavailable.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [scenarioKey]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-headline-sm text-on-surface-variant animate-pulse">
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-md">
        <div className="bg-error/10 border border-error/20 text-error p-lg rounded-xl flex flex-col gap-sm">
          <h3 className="font-headline-sm text-headline-sm font-bold flex items-center gap-xs">
            <span className="material-symbols-outlined text-error">error</span>
            System Error
          </h3>
          <p className="font-body-lg text-body-lg">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="self-start px-sm py-xs bg-error text-on-error rounded-lg font-semibold hover:bg-error-container transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const accounts = data?.accounts || [];
  const netWorth = data?.netWorth || 0;
  const totalDeposits = data?.totalDeposits || 0;
  const totalMortgage = data?.totalMortgage || 0;

  return (
    <div className="flex flex-col gap-md">
      {/* Row 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <KPICard
          title="Total Net Worth"
          value={formatCurrency(netWorth)}
          icon="account_balance"
          trend="+4.2%"
        />
        <KPICard
          title="Total Deposits (Fiserv)"
          value={formatCurrency(totalDeposits)}
          icon="savings"
        />
        <KPICard
          title="Total Mortgage (Cenlar)"
          value={formatCurrency(totalMortgage)}
          icon="home_work"
        />
      </div>

      {/* Row 2: Large Data Table Card */}
      <div className="card-surface rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Your Aggregated Accounts
          </h3>
        </div>
        <AccountTable accounts={accounts} />
      </div>

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
                stroke="#94A3B8"
                strokeDasharray="4 4"
                strokeWidth="2"
              ></path>
            </svg>
          </div>
        </div>

        {/* Donut Chart (4-col) */}
        <AllocationChart accounts={accounts} />
      </div>
    </div>
  );
};

export default DashboardPage;
