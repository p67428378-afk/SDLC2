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

export const mortgageService = {
  getDetails: async (id) => {
    const response = await api.get(`/api/v1/mortgages/${id}`);
    return response.data;
  },
  getPaymentHistory: async (id) => {
    const response = await api.get(`/api/v1/mortgages/${id}/payments`);
    return response.data;
  },
};

export const accountService = {
  listAccounts: async (eligible = true) => {
    const response = await api.get("/api/v1/accounts", {
      params: { eligible },
    });
    return response.data;
  },
};

export const paymentService = {
  validatePayment: async (payload) => {
    const response = await api.post("/api/v1/payments/validate", payload);
    return response.data;
  },
  submitPayment: async (payload) => {
    const response = await api.post("/api/v1/payments", payload);
    return response.data;
  },
  getPaymentStatus: async (id) => {
    const response = await api.get(`/api/v1/payments/${id}`);
    return response.data;
  },
};

export const scheduledPaymentService = {
  listScheduled: async () => {
    const response = await api.get("/api/v1/scheduled-payments");
    return response.data;
  },
  createScheduled: async (payload) => {
    const response = await api.post("/api/v1/scheduled-payments", payload);
    return response.data;
  },
  updateScheduled: async (id, payload) => {
    const response = await api.put(`/api/v1/scheduled-payments/${id}`, payload);
    return response.data;
  },
  deleteScheduled: async (id) => {
    const response = await api.delete(`/api/v1/scheduled-payments/${id}`);
    return response.data;
  },
};

export default api;
