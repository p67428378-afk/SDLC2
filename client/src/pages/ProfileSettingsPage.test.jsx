import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProfileSettingsPage from "./ProfileSettingsPage";
import profileService from "../services/profileService";

vi.mock("../services/profileService", () => ({
  default: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock("../components/layout/AppLayout", () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

describe("ProfileSettingsPage Component", () => {
  const mockProfile = {
    first_name: "Jane",
    last_name: "Doe",
    cif: "CIF-982341",
    email: "test@example.com",
    phone: "1234567890",
    address: "123 Financial Way, Suite 100, New York, NY 10001",
    relationship_manager: "Robert Vance",
    preferences: {
      paperless: true,
      email_notifications: true,
      sms_notifications: false,
      marketing_opt_in: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    profileService.getProfile.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/loading profile settings.../i),
    ).toBeInTheDocument();
  });

  it("renders profile settings page with overview tab by default", async () => {
    profileService.getProfile.mockResolvedValueOnce(mockProfile);
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <ProfileSettingsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      screen.debug();
      expect(screen.getByText("Profile Settings")).toBeInTheDocument();
    });
  });
});
