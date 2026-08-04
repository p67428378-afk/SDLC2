import axios from "axios";

// SCRUM-602: Base API URL configured via environment variable with local fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to inject JWT token
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
  getMfaCode: async (email) => {
    const response = await api.get("/api/v1/auth/mfa-code", {
      params: { email },
    });
    return response.data;
  },
  verifyMfa: async (mfaToken, code) => {
    const response = await api.post("/api/v1/auth/verify-mfa", {
      mfa_token: mfaToken,
      code,
    });
    if (response.data.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("token");
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
  getSummary: async () => {
    const response = await api.get("/api/v1/summary");
    return response.data;
  },
  getBankingAccounts: async () => {
    const response = await api.get("/api/v1/accounts/banking");
    return response.data;
  },
  getMortgageAccounts: async () => {
    const response = await api.get("/api/v1/accounts/mortgage");
    return response.data;
  },
  getAccountDetail: async (source, accountId) => {
    const response = await api.get(`/api/v1/accounts/${source}/${accountId}`);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get("/api/v1/profile");
    return response.data;
  },
};

export default api;
