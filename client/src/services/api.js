import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getTodaySummary = async () => {
  const response = await api.get("/api/v1/time-entries/today");
  return response.data;
};

export const createTimeEntry = async (entryData) => {
  const response = await api.post("/api/v1/time-entries", entryData);
  return response.data;
};

export const listTimeEntries = async (params = {}) => {
  const response = await api.get("/api/v1/time-entries", { params });
  return response.data;
};

export const deleteTimeEntry = async (entryId) => {
  const response = await api.delete(`/api/v1/time-entries/${entryId}`);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get("/api/v1/users/me");
  return response.data;
};

export const updateUserPreferences = async (preferences) => {
  const response = await api.patch("/api/v1/users/me/preferences", preferences);
  return response.data;
};

export default api;
