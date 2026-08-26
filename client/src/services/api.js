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
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: clear auth on 401 if unauthorized
      // localStorage.removeItem('token');
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
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

export const projectsAPI = {
  listProjects: async (params = {}) => {
    const response = await apiClient.get("/api/v1/projects", { params });
    return response.data;
  },
  createProject: async (projectData) => {
    const response = await apiClient.post("/api/v1/projects", projectData);
    return response.data;
  },
  getProject: async (id) => {
    const response = await apiClient.get(`/api/v1/projects/${id}`);
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

export const timesheetsAPI = {
  listTimesheets: async (params = {}) => {
    const response = await apiClient.get("/api/v1/timesheets", { params });
    return response.data;
  },
  createTimesheet: async (entryData) => {
    const response = await apiClient.post("/api/v1/timesheets", entryData);
    return response.data;
  },
  getTimesheet: async (id) => {
    const response = await apiClient.get(`/api/v1/timesheets/${id}`);
    return response.data;
  },
  updateTimesheet: async (id, entryData) => {
    const response = await apiClient.put(`/api/v1/timesheets/${id}`, entryData);
    return response.data;
  },
  deleteTimesheet: async (id) => {
    const response = await apiClient.delete(`/api/v1/timesheets/${id}`);
    return response.data;
  },
  approveTimesheet: async (id, status) => {
    const response = await apiClient.put(`/api/v1/timesheets/${id}/approve`, {
      status,
    });
    return response.data;
  },
  bulkApproveTimesheets: async (entry_ids, status) => {
    const response = await apiClient.put("/api/v1/timesheets/bulk-approve", {
      entry_ids,
      status,
    });
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
