import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
});

// Automatically attach token if present
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
  async login(email, password) {
    const response = await api.post("/api/v1/auth/login", { email, password });
    if (response.data && response.data.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },
  logout() {
    localStorage.removeItem("token");
  },
  isLoggedIn() {
    return !!localStorage.getItem("token");
  },
};

export const mortgageService = {
  async getEligibleAccounts() {
    const response = await api.get("/api/v1/mortgage/accounts");
    return response.data;
  },
  async validatePayment(source_account_id, amount) {
    const response = await api.post("/api/v1/mortgage/payments/validate", {
      source_account_id,
      amount: parseFloat(amount),
    });
    return response.data;
  },
  async createPayment(payload) {
    const response = await api.post("/api/v1/mortgage/payments", {
      amount: parseFloat(payload.amount),
      mortgage_account_id: payload.mortgage_account_id,
      payment_type: payload.payment_type,
      scheduled_date: payload.scheduled_date || null,
      source_account_id: payload.source_account_id,
    });
    return response.data;
  },
  async getPaymentHistory() {
    const response = await api.get("/api/v1/mortgage/payments/history");
    return response.data;
  },
  async getScheduledPayments() {
    const response = await api.get("/api/v1/mortgage/payments/scheduled");
    return response.data;
  },
  async getPaymentDetail(payment_id) {
    const response = await api.get(`/api/v1/mortgage/payments/${payment_id}`);
    return response.data;
  },
  async getPaymentReceipt(payment_id) {
    const response = await api.get(
      `/api/v1/mortgage/payments/${payment_id}/receipt`,
    );
    return response.data;
  },
};

export default api;
