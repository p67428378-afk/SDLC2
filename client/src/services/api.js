import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getProjects = async () => {
  const response = await api.get("/api/v1/projects");
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post("/api/v1/projects", projectData);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.put(`/api/v1/projects/${projectId}`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/api/v1/projects/${projectId}`);
  return response.data;
};

export const getDailySummary = async (dateStr) => {
  const params = {};
  if (dateStr) {
    params.entry_date = dateStr;
  }
  const response = await api.get("/api/v1/time-entries/daily-summary", {
    params,
  });
  return response.data;
};

export const getTodaySummary = async () => {
  const today = new Date().toISOString().split("T")[0];
  return getDailySummary(today);
};

export const listTimeEntries = async (params = {}) => {
  const response = await api.get("/api/v1/time-entries", { params });
  return response.data;
};

export const createTimeEntry = async (entryData) => {
  const response = await api.post("/api/v1/time-entries", entryData);
  return response.data;
};

export const deleteTimeEntry = async (entryId) => {
  const response = await api.delete(`/api/v1/time-entries/${entryId}`);
  return response.data;
};

export default api;
