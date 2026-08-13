import React, { useState, useEffect } from "react";
import {
  getKPIs,
  getSKUs,
  getScenario,
  createSubmission,
} from "./services/api";
import KPIHeaderStrip from "./components/KPIHeaderStrip";
import SKUPerformanceTable from "./components/SKUPerformanceTable";
import ScenarioSelector from "./components/ScenarioSelector";
import ApprovalReviewPanel from "./components/ApprovalReviewPanel";
import ConfirmationModal from "./components/ConfirmationModal";

export default function App() {
  const [kpis, setKPIs] = useState(null);
  const [kpisLoading, setKPIsLoading] = useState(true);
  const [kpisError, setKPIsError] = useState(null);

  const [skus, setSKUs] = useState([]);
  const [skusLoading, setSKUsLoading] = useState(true);
  const [skusError, setSKUsError] = useState(null);
  const [skuFilter, setSkuFilter] = useState("");
  const [skuSort, setSkuSort] = useState("");

  const [selectedScenario, setSelectedScenario] = useState("Balanced");
  const [scenariosData, setScenariosData] = useState({});
  const [scenariosLoading, setScenariosLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch KPIs on mount
  useEffect(() => {
    const fetchKPIsData = async () => {
      try {
        setKPIsLoading(true);
        const data = await getKPIs();
        setKPIs(data);
        setKPIsError(null);
      } catch (err) {
        console.error("Error fetching KPIs:", err);
        setKPIsError("Failed to load KPIs");
      } finally {
        setKPIsLoading(false);
      }
    };
    fetchKPIsData();
  }, []);

  // Fetch SKUs when filter or sort changes
  useEffect(() => {
    const fetchSKUsData = async () => {
      try {
        setSKUsLoading(true);
        const data = await getSKUs(skuSort, skuFilter);
        setSKUs(data);
        setSKUsError(null);
      } catch (err) {
        console.error("Error fetching SKUs:", err);
        setSKUsError("Failed to load SKUs");
      } finally {
        setSKUsLoading(false);
      }
    };
    fetchSKUsData();
  }, [skuFilter, skuSort]);

  // Fetch all scenarios on mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setScenariosLoading(true);
        const [conservative, balanced, aggressive] = await Promise.all([
          getScenario("Conservative").catch(() => null),
          getScenario("Balanced").catch(() => null),
          getScenario("Aggressive").catch(() => null),
        ]);

        const data = {};
        if (conservative) data.Conservative = conservative;
        if (balanced) data.Balanced = balanced;
        if (aggressive) data.Aggressive = aggressive;

        setScenariosData(data);
      } catch (err) {
        console.error("Error fetching scenarios:", err);
      } finally {
        setScenariosLoading(false);
      }
    };
    fetchScenarios();
  }, []);

  const handleSubmitApproval = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      const result = await createSubmission(selectedScenario);
      setSubmissionResult(result);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error submitting for approval:", err);
      setSubmitError(
        err.response?.data?.detail ||
          "Failed to submit for approval. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col relative">
      {/* Navigation */}
      <nav class="bg-inverse-surface dark:bg-inverse-surface docked full-width top-0 h-[64px] border-b border-outline-variant flat no shadows flex justify-between items-center w-full px-lg max-w-container-max mx-auto shrink-0 sticky z-50">
        <div class="flex items-center gap-md">
          <img
            alt="DG Logo"
            class="h-8 w-auto"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlvYmMG-13W4b1niztTbuscIV5Znj5wragnAB6b6309tAoPzmK4qodKbHDTYnhsBS-ZxXhwbQvpAp40jO7WYMnzfELE6VZXOrhxxWpxX0XRp1anwXFOOe7oVD1IoPx5vnndoYK-dpYii7Iob1eRBigat3Wh1Cd3vrX1Zgqjt7W0EaAO_s8HXgsN8eCBFIrA-PWsHpdMokA1obRtyAJFrVtXe7D3nqwShSmRidlbL1t1_XzMk26dtV-GcCdnx2U4CAe7oUTk0QET6dl"
          />
          <span class="font-headline-md text-headline-md font-bold text-primary-container">
            Assortment Advisor
          </span>
        </div>
        <div class="hidden md:flex flex-1 justify-center items-center gap-sm font-label-md text-label-md">
          <a
            class="text-surface-variant font-body-md hover:bg-surface-variant/10 hover:text-primary-fixed-dim transition-colors px-2 py-1 rounded"
            href="#"
          >
            Store Clusters
          </a>
          <span
            class="material-symbols-outlined text-surface-variant text-sm"
            data-icon="chevron_right"
            data-weight="fill"
          >
            chevron_right
          </span>
          <a
            class="text-primary-container font-bold border-b-2 border-primary-container pb-1 hover:bg-surface-variant/10 hover:text-primary-fixed-dim transition-colors px-2 py-1 rounded"
            href="#"
          >
            Small Town Value Cluster
          </a>
          <span
            class="material-symbols-outlined text-surface-variant text-sm"
            data-icon="chevron_right"
            data-weight="fill"
          >
            chevron_right
          </span>
          <a
            class="text-surface-variant font-body-md hover:bg-surface-variant/10 hover:text-primary-fixed-dim transition-colors px-2 py-1 rounded"
            href="#"
          >
            Snacks Category
          </a>
        </div>
        <div class="flex items-center gap-md">
          <button class="text-primary-container dark:text-primary-fixed hover:bg-surface-variant/10 hover:text-primary-fixed-dim transition-colors p-2 rounded-full flex items-center justify-center">
            <span
              class="material-symbols-outlined"
              data-icon="notifications"
              data-weight="fill"
            >
              notifications
            </span>
          </button>
          <div class="flex items-center gap-sm">
            <img
              class="w-8 h-8 rounded-full object-cover border border-outline-variant"
              alt="Category Manager"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5n4YDK_eTTTllEeWEhc7kV5zSwUdffK92Pf83L6BwR4ZAM_xIsl427xlw0CznGV1-I8zaI7774MezdMHSLyWLl-2Y0dhLbbwrjGep9Oe_8QW4rzu2_WF7dIM1Pq8nd_ZTYeqjQqZYY0FR8uWH9HJOwIERmGL2V-D7DDUPrCBD8F1iLallH4D4HtSYYomi32wHZUIlj4DL7KORYnZvCu6PbM4e-m3u-YOEyeM0uWk7XNUXx6gKwOGGO56ellT8higHe1Axfaswgpg9"
            />
            <div class="hidden lg:flex flex-col">
              <span class="font-label-md text-label-md text-on-tertiary">
                John Doe
              </span>
              <span class="font-label-sm text-label-sm text-surface-variant text-[10px] leading-tight">
                Category Manager
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div class="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside class="hidden xl:flex bg-inverse-surface dark:bg-inverse-surface docked left-0 h-full w-[280px] border-r border-outline-variant flat no shadows fixed left-0 top-0 bottom-0 flex-col pt-[64px] z-40">
          <div class="p-lg flex items-center gap-md border-b border-outline-variant/30">
            <div class="w-10 h-10 bg-primary-container rounded flex items-center justify-center font-headline-sm text-on-primary-fixed-variant font-bold">
              DG
            </div>
            <div>
              <h2 class="font-headline-sm text-headline-sm font-black text-primary-container">
                DG Advisor
              </h2>
              <p class="font-label-sm text-label-sm text-surface-variant">
                Retail Logistics
              </p>
            </div>
          </div>
          <nav class="flex-1 overflow-y-auto py-md flex flex-col gap-sm px-sm">
            <a
              class="flex items-center gap-md px-md py-sm rounded-lg text-surface-variant hover:bg-surface-variant/5 hover:text-on-primary-fixed-variant transition-all duration-200 ease-in-out font-label-md text-label-md"
              href="#"
            >
              <span
                class="material-symbols-outlined"
                data-icon="dashboard"
                data-weight="fill"
              >
                dashboard
              </span>
              Dashboard
            </a>
            <a
              class="flex items-center gap-md px-md py-sm rounded-lg text-primary-container border-l-4 border-primary-container bg-surface-variant/10 transition-all duration-200 ease-in-out font-label-md text-label-md"
              href="#"
            >
              <span
                class="material-symbols-outlined"
                data-icon="hub"
                data-weight="fill"
              >
                hub
              </span>
              Clusters
            </a>
            <a
              class="flex items-center gap-md px-md py-sm rounded-lg text-surface-variant hover:bg-surface-variant/5 hover:text-on-primary-fixed-variant transition-all duration-200 ease-in-out font-label-md text-label-md"
              href="#"
            >
              <span
                class="material-symbols-outlined"
                data-icon="inventory_2"
                data-weight="fill"
              >
                inventory_2
              </span>
              Assortment
            </a>
            <a
              class="flex items-center gap-md px-md py-sm rounded-lg text-surface-variant hover:bg-surface-variant/5 hover:text-on-primary-fixed-variant transition-all duration-200 ease-in-out font-label-md text-label-md"
              href="#"
            >
              <span
                class="material-symbols-outlined"
                data-icon="analytics"
                data-weight="fill"
              >
                analytics
              </span>
              Analytics
            </a>
            <a
              class="flex items-center gap-md px-md py-sm rounded-lg text-surface-variant hover:bg-surface-variant/5 hover:text-on-primary-fixed-variant transition-all duration-200 ease-in-out font-label-md text-label-md mt-auto"
              href="#"
            >
              <span
                class="material-symbols-outlined"
                data-icon="settings"
                data-weight="fill"
              >
                settings
              </span>
              Settings
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main class="flex-1 w-full xl:ml-[280px] p-md md:p-lg lg:p-margin max-w-container-max mx-auto overflow-y-auto bg-background">
          <KPIHeaderStrip kpis={kpis} loading={kpisLoading} error={kpisError} />

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            <div class="lg:col-span-8 flex flex-col gap-lg">
              <SKUPerformanceTable
                skus={skus}
                loading={skusLoading}
                error={skusError}
                onFilterChange={setSkuFilter}
                onSortChange={setSkuSort}
              />

              <ScenarioSelector
                selectedScenario={selectedScenario}
                onScenarioSelect={setSelectedScenario}
                scenariosData={scenariosData}
              />
            </div>

            <div class="lg:col-span-4 flex flex-col gap-md">
              <ApprovalReviewPanel
                selectedScenario={selectedScenario}
                scenarioData={scenariosData[selectedScenario]}
                onSubmit={handleSubmitApproval}
                submitting={submitting}
                error={submitError}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submission={submissionResult}
      />
    </div>
  );
}
