import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post("/api/v1/auth/login", {
      username,
      password,
    });
    return response.data;
  },
  verifyMfa: async (code, mfaToken) => {
    const response = await api.post("/api/v1/auth/mfa/verify", {
      code,
      mfa_token: mfaToken,
    });
    if (response.data && response.data.access_token) {
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

export const dashboardService = {
  getDashboard: async () => {
    const response = await api.get("/api/v1/dashboard");
    return response.data;
  },
};

export const accountService = {
  getAccountDetails: async (accountId) => {
    const response = await api.get(`/api/v1/accounts/${accountId}`);
    return response.data;
  },
};

export const mockService = {
  configureMock: async (scenario) => {
    const response = await api.post("/api/v1/mock/config", { scenario });
    return response.data;
  },
};

export default api;
