import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getKPIs = async () => {
  const response = await api.get("/api/v1/kpis");
  return response.data;
};

export const getSKUs = async (sortBy = "", status = "") => {
  const params = {};
  if (sortBy) params.sort_by = sortBy;
  if (status) params.status = status;
  const response = await api.get("/api/v1/skus", { params });
  return response.data;
};

export const getScenario = async (scenarioName) => {
  const response = await api.get(`/api/v1/scenarios/${scenarioName}`);
  return response.data;
};

export const createSubmission = async (scenarioName) => {
  const response = await api.post("/api/v1/submissions", {
    scenario_name: scenarioName,
  });
  return response.data;
};

export const getSubmission = async (submissionId) => {
  const response = await api.get(`/api/v1/submissions/${submissionId}`);
  return response.data;
};

export default {
  getKPIs,
  getSKUs,
  getScenario,
  createSubmission,
  getSubmission,
};
