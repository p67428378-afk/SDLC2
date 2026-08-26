import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem("token")
          : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error),
);

export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post("/api/v1/auth/login", credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await apiClient.post("/api/v1/auth/register", userData);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get("/api/v1/auth/me");
    return response.data;
  },
};

export const projectsApi = {
  listProjects: async (activeOnly = null) => {
    const params = {};
    if (activeOnly !== null) {
      params.active_only = activeOnly;
    }
    const response = await apiClient.get("/api/v1/projects", { params });
    return response.data;
  },
  getProject: async (id) => {
    const response = await apiClient.get(`/api/v1/projects/${id}`);
    return response.data;
  },
  createProject: async (projectData) => {
    const response = await apiClient.post("/api/v1/projects", projectData);
    return response.data;
  },
  updateProject: async (id, projectData) => {
    const response = await apiClient.put(`/api/v1/projects/${id}`, projectData);
    return response.data;
  },
  deleteProject: async (id) => {
    const response = await apiClient.delete(`/api/v1/projects/${id}`);
    return response.data;
  },
};

export const timesheetsApi = {
  listTimesheets: async (params = {}) => {
    const response = await apiClient.get("/api/v1/timesheets", { params });
    return response.data;
  },
  getTimesheet: async (id) => {
    const response = await apiClient.get(`/api/v1/timesheets/${id}`);
    return response.data;
  },
  createTimesheet: async (timesheetData) => {
    const response = await apiClient.post("/api/v1/timesheets", timesheetData);
    return response.data;
  },
  updateTimesheet: async (id, timesheetData) => {
    const response = await apiClient.put(
      `/api/v1/timesheets/${id}`,
      timesheetData,
    );
    return response.data;
  },
  deleteTimesheet: async (id) => {
    const response = await apiClient.delete(`/api/v1/timesheets/${id}`);
    return response.data;
  },
  approveTimesheet: async (id, approvalData) => {
    const response = await apiClient.put(
      `/api/v1/timesheets/${id}/approve`,
      approvalData,
    );
    return response.data;
  },
  bulkApprove: async (bulkData) => {
    const response = await apiClient.put(
      "/api/v1/timesheets/bulk-approve",
      bulkData,
    );
    return response.data;
  },
  getSummary: async (params = {}) => {
    const response = await apiClient.get("/api/v1/timesheets/summary", {
      params,
    });
    return response.data;
  },
};

export default apiClient;
