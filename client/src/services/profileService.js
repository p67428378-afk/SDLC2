import api from "./api";

export const profileService = {
  getProfile: async () => {
    const response = await api.get("/api/v1/profile");
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put("/api/v1/profile", profileData);
    return response.data;
  },
  getProfileHistory: async () => {
    const response = await api.get("/api/v1/profile/history");
    return response.data;
  },
};

export default profileService;
