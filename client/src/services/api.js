import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
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
  (error) => Promise.reject(error),
);

export const login = async (username, password) => {
  const response = await api.post("/auth/dummy-login", { username, password });
  if (response.data && response.data.access_token) {
    localStorage.setItem("token", response.data.access_token);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getMortgageDetails = async () => {
  const response = await api.get("/api/v1/mortgage/details");
  return response.data;
};

export const getFundingAccounts = async () => {
  const response = await api.get("/api/v1/mortgage/accounts");
  return response.data;
};

export const validateAccountBalance = async (accountId, paymentAmount) => {
  const response = await api.post(
    `/api/v1/mortgage/accounts/${accountId}/validate`,
    {
      paymentAmount,
    },
  );
  return response.data;
};

export const submitPayment = async (paymentData) => {
  const response = await api.post("/api/v1/mortgage/payments", paymentData);
  return response.data;
};

export const getScheduledPayments = async () => {
  const response = await api.get("/api/v1/mortgage/payments/scheduled");
  return response.data;
};

export const getPaymentReceipt = async (transactionId) => {
  const response = await api.get(
    `/api/v1/mortgage/payments/${transactionId}/receipt`,
  );
  return response.data;
};

export default api;
