import React, { useState, useEffect, useCallback } from "react";
import KpiHeaderStrip from "./components/KpiHeaderStrip.jsx";
import SkuPerformanceTable from "./components/SkuPerformanceTable.jsx";
import ScenarioSelector from "./components/ScenarioSelector.jsx";
import ApprovalReviewPanel from "./components/ApprovalReviewPanel.jsx";
import InlineConfirmation from "./components/InlineConfirmation.jsx";
import {
  getKpiMetrics,
  getSkus,
  evaluateScenario,
  getScenarios,
  checkGuardrails,
  createSubmission,
} from "./services/api.js";

const INITIAL_SKUS = [
  {
    sku_code: "SKU-10492",
    product_name: "DG Value Pretzels 12oz",
    category: "Snacks",
    weekly_velocity: 142.5,
    margin_pct: 34.2,
    linear_feet: 1.5,
    is_private_brand: true,
    status_badge: "GROW",
  },
  {
    sku_code: "SKU-8821",
    product_name: "Slow Chips 6oz",
    category: "Snacks",
    weekly_velocity: 18.0,
    margin_pct: 12.5,
    linear_feet: 2.0,
    is_private_brand: false,
    status_badge: "SWAP",
  },
  {
    sku_code: "SKU-9041",
    product_name: "DG Trail Mix 8oz",
    category: "Snacks",
    weekly_velocity: 98.0,
    margin_pct: 29.5,
    linear_feet: 1.0,
    is_private_brand: true,
    status_badge: "MAINTAIN",
  },
  {
    sku_code: "SKU-7712",
    product_name: "Salty Pretzel Sticks 10oz",
    category: "Snacks",
    weekly_velocity: 22.0,
    margin_pct: 15.0,
    linear_feet: 1.5,
    is_private_brand: false,
    status_badge: "REDUCE",
  },
];

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [skus, setSkus] = useState(INITIAL_SKUS);
  const [selectedScenario, setSelectedScenario] = useState("Balanced");
  const [scenarioEvaluations, setScenarioEvaluations] = useState({});
  const [guardrailStatus, setGuardrailStatus] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 1. Initial Load: KPIs, SKUs, Scenarios, Guardrails
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, skusRes, scenariosRes, guardrailsRes] =
        await Promise.allSettled([
          getKpiMetrics("Small Town Value Cluster", "Snacks"),
          getSkus({ category: "Snacks", limit: 50 }),
          getScenarios(),
          checkGuardrails({
            shelf_capacity_pct: 92.0,
            private_brand_pct: 28.0,
            in_stock_rate_pct: 96.5,
          }),
        ]);

      if (kpiRes.status === "fulfilled" && kpiRes.value) {
        setMetrics(kpiRes.value);
      }

      if (skusRes.status === "fulfilled" && skusRes.value?.items?.length) {
        setSkus(skusRes.value.items);
      }

      if (
        scenariosRes.status === "fulfilled" &&
        Array.isArray(scenariosRes.value)
      ) {
        const evalMap = {};
        scenariosRes.value.forEach((sc) => {
          if (sc.scenario_type) {
            evalMap[sc.scenario_type] = sc;
          }
        });
        setScenarioEvaluations(evalMap);
      }

      if (guardrailsRes.status === "fulfilled" && guardrailsRes.value) {
        setGuardrailStatus(guardrailsRes.value);
      }
    } catch {
      // Fallback to initial state gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Scenario Change Handler
  const handleSelectScenario = async (scenarioType) => {
    setSelectedScenario(scenarioType);

    // Dynamic guardrail adjustments based on scenario
    let targetShelf = 92.0;
    let targetPB = 28.0;
    let targetInStock = 96.5;

    if (scenarioType === "Conservative") {
      targetShelf = 89.0;
      targetPB = 26.5;
      targetInStock = 98.0;
    } else if (scenarioType === "Aggressive") {
      targetShelf = 96.0;
      targetPB = 31.2;
      targetInStock = 95.2;
    }

    try {
      const evalRes = await evaluateScenario({
        cluster_name: "Small Town Value Cluster",
        category: "Snacks",
        scenario_type: scenarioType,
      });

      if (evalRes) {
        setScenarioEvaluations((prev) => ({
          ...prev,
          [scenarioType]: evalRes,
        }));
      }

      const gRes = await checkGuardrails({
        shelf_capacity_pct: targetShelf,
        private_brand_pct: targetPB,
        in_stock_rate_pct: targetInStock,
      });

      if (gRes) {
        setGuardrailStatus(gRes);
      }
    } catch {
      // Handled silently with existing state
    }
  };

  // 3. Custom SKU Action Override
  const handleSkuActionChange = (skuCode, newAction) => {
    setSkus((prevSkus) =>
      prevSkus.map((sku) =>
        sku.sku_code === skuCode ? { ...sku, status_badge: newAction } : sku,
      ),
    );
  };

  // 4. Submit Assortment Plan
  const handleSubmitPlan = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const skuDecisions = skus.map((sku) => ({
      sku_code: sku.sku_code,
      action: sku.status_badge || "MAINTAIN",
    }));

    try {
      const res = await createSubmission({
        user_id: "usr_cat_mgr_01",
        cluster_name: "Small Town Value Cluster",
        category: "Snacks",
        selected_scenario: selectedScenario,
        sku_decisions: skuDecisions,
      });

      if (res && res.status) {
        setSubmissionResult(res);
      } else {
        setSubmitError(
          "Unexpected response from server during plan submission.",
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Submission failed. Please check network connectivity.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Strip */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700 shadow-sm gap-4">
          <div className="flex items-center space-x-3">
            <span className="bg-[#FFC200] text-slate-900 font-bold px-3 py-1 rounded text-lg shadow-sm">
              DG
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Dollar General — Cluster Assortment Advisor
              </h1>
              <p className="text-xs text-slate-400">
                Category:{" "}
                <span className="text-slate-300 font-medium">Snacks</span> |
                Store Cluster:{" "}
                <span className="text-slate-300 font-medium">
                  Small Town Value Cluster
                </span>{" "}
                | Last Updated: Today, 11:00 AM
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 self-end md:self-auto">
            <span className="bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-600 shadow-sm">
              Cluster 04 · 1,420 Stores
            </span>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                Category Manager
              </p>
              <p className="text-xs text-slate-400 font-mono">usr_cat_mgr_01</p>
            </div>
          </div>
        </header>

        {/* Inline Audit Confirmation Banner (if submitted) */}
        {submissionResult && (
          <InlineConfirmation
            submissionResult={submissionResult}
            onDismiss={() => setSubmissionResult(null)}
          />
        )}

        {/* Section 1: KPI Header Strip */}
        <KpiHeaderStrip metrics={metrics} loading={loading} />

        {/* Section 2: Middle Split - SKU Performance Table (left 7 cols) & Scenario Selector (right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
          <div className="lg:col-span-7">
            <SkuPerformanceTable
              skus={skus}
              loading={loading}
              onActionChange={handleSkuActionChange}
            />
          </div>
          <div className="lg:col-span-5">
            <ScenarioSelector
              selectedScenario={selectedScenario}
              onSelectScenario={handleSelectScenario}
              scenarioEvaluations={scenarioEvaluations}
            />
          </div>
        </div>

        {/* Section 3: Approval Review Panel & Operational Guardrail Verification */}
        <ApprovalReviewPanel
          selectedScenario={selectedScenario}
          guardrailStatus={guardrailStatus}
          onSubmit={handleSubmitPlan}
          submitting={submitting}
          skuCount={skus.length}
          error={submitError}
        />
      </div>
    </div>
  );
}
