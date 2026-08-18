import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Projects API
export const getProjects = async () => {
  const response = await apiClient.get("/api/v1/projects");
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await apiClient.post("/api/v1/projects", projectData);
  return response.data;
};

export const updateProject = async (id, projectData) => {
  const response = await apiClient.put(`/api/v1/projects/${id}`, projectData);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await apiClient.delete(`/api/v1/projects/${id}`);
  return response.data;
};

// Time Entries API
export const getTimeEntries = async (entryDate) => {
  const params = entryDate ? { date: entryDate } : {};
  const response = await apiClient.get("/api/v1/time-entries", { params });
  return response.data;
};

export const createTimeEntry = async (entryData) => {
  const response = await apiClient.post("/api/v1/time-entries", entryData);
  return response.data;
};

export const getDailySummary = async (entryDate) => {
  const params = entryDate ? { date: entryDate } : {};
  const response = await apiClient.get("/api/v1/time-entries/daily-summary", {
    params,
  });
  return response.data;
};

export const deleteTimeEntry = async (id) => {
  const response = await apiClient.delete(`/api/v1/time-entries/${id}`);
  return response.data;
};

export default apiClient;
