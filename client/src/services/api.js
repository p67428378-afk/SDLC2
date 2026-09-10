import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const getKpiMetrics = async (
  clusterName = "Small Town Value Cluster",
  category = "Snacks",
) => {
  const response = await apiClient.get("/api/v1/metrics/kpi", {
    params: {
      cluster_name: clusterName,
      category: category,
    },
  });
  return response.data;
};

export const getSkus = async (params = {}) => {
  const response = await apiClient.get("/api/v1/skus", {
    params: {
      category: params.category || "Snacks",
      skip: params.skip || 0,
      limit: params.limit || 50,
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return response.data;
};

export const getSkuByCode = async (skuCode) => {
  const response = await apiClient.get(
    `/api/v1/skus/${encodeURIComponent(skuCode)}`,
  );
  return response.data;
};

export const evaluateScenario = async (scenarioData) => {
  const response = await apiClient.post("/api/v1/scenarios/evaluate", {
    cluster_name: scenarioData.cluster_name || "Small Town Value Cluster",
    category: scenarioData.category || "Snacks",
    scenario_type:
      scenarioData.scenario_type ||
      scenarioData.selected_scenario ||
      "Balanced",
  });
  return response.data;
};

export const getScenarios = async () => {
  const response = await apiClient.get("/api/v1/scenarios");
  return response.data;
};

export const checkGuardrails = async (guardrailData = {}) => {
  const response = await apiClient.post("/api/v1/guardrails/check", {
    shelf_capacity_pct: guardrailData.shelf_capacity_pct,
    private_brand_pct: guardrailData.private_brand_pct,
    in_stock_rate_pct: guardrailData.in_stock_rate_pct,
  });
  return response.data;
};

export const createSubmission = async (submissionData) => {
  const response = await apiClient.post("/api/v1/submissions", {
    user_id: submissionData.user_id || "usr_cat_mgr_01",
    cluster_name: submissionData.cluster_name || "Small Town Value Cluster",
    category: submissionData.category || "Snacks",
    selected_scenario: submissionData.selected_scenario || "Balanced",
    sku_decisions: submissionData.sku_decisions || [],
  });
  return response.data;
};

export const getSubmissions = async (skip = 0, limit = 20) => {
  const response = await apiClient.get("/api/v1/submissions", {
    params: { skip, limit },
  });
  return response.data;
};

export const getSubmissionByAuditId = async (auditId) => {
  const response = await apiClient.get(
    `/api/v1/submissions/${encodeURIComponent(auditId)}`,
  );
  return response.data;
};

export default {
  getKpiMetrics,
  getSkus,
  getSkuByCode,
  evaluateScenario,
  getScenarios,
  checkGuardrails,
  createSubmission,
  getSubmissions,
  getSubmissionByAuditId,
};
