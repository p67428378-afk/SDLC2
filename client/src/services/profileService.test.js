import { describe, it, expect, vi, beforeEach } from "vitest";
import { profileService } from "./profileService";
import api from "./api";

vi.mock("./api", () => {
  return {
    default: {
      get: vi.fn(),
      put: vi.fn(),
    },
  };
});

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getProfile calls api.get and returns data", async () => {
    const mockProfile = { cif: "123", first_name: "Jane" };
    api.get.mockResolvedValue({ data: mockProfile });

    const result = await profileService.getProfile();
    expect(api.get).toHaveBeenCalledWith("/api/v1/profile");
    expect(result).toEqual(mockProfile);
  });

  it("updateProfile calls api.put and returns data", async () => {
    const mockPayload = {
      address: "123 St",
      email: "jane@example.com",
      phone: "1234567890",
      preferences: {},
    };
    const mockResponse = { ...mockPayload, cif: "123" };
    api.put.mockResolvedValue({ data: mockResponse });

    const result = await profileService.updateProfile(mockPayload);
    expect(api.put).toHaveBeenCalledWith("/api/v1/profile", mockPayload);
    expect(result).toEqual(mockResponse);
  });

  it("getProfileHistory calls api.get and returns data", async () => {
    const mockHistory = [{ id: 1, status: "SUCCESS" }];
    api.get.mockResolvedValue({ data: mockHistory });

    const result = await profileService.getProfileHistory();
    expect(api.get).toHaveBeenCalledWith("/api/v1/profile/history");
    expect(result).toEqual(mockHistory);
  });
});
