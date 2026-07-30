import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProfileSettingsPage from "./ProfileSettingsPage";
import { profileService } from "../services/profileService";

// Mock services
vi.mock("../services/profileService", () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getProfileHistory: vi.fn(),
  },
}));

// Mock AppLayout to avoid rendering sidebar/header complexity
vi.mock("../components/layout/AppLayout", () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

describe("ProfileSettingsPage", () => {
  const mockProfile = {
    first_name: "Jane",
    last_name: "Doe",
    cif: "CIF-982341",
    address: "123 Financial Way",
    phone: "1234567890",
    email: "test@example.com",
    relationship_manager: "Sarah Jenkins",
    preferences: {
      email_notif: true,
      marketing: false,
      paperless: true,
      sms_notif: false,
    },
  };

  const mockHistory = [
    {
      id: 1,
      timestamp: "2026-07-30T10:00:00Z",
      status: "SUCCESS",
      changed_fields_after: { address: "123 Financial Way" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    profileService.getProfile.mockReturnValue(new Promise(() => {}));
    profileService.getProfileHistory.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Loading profile settings.../i),
    ).toBeInTheDocument();
  });

  it("renders profile overview after loading", async () => {
    profileService.getProfile.mockResolvedValue(mockProfile);
    profileService.getProfileHistory.mockResolvedValue(mockHistory);

    render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Profile Settings")).toBeInTheDocument();
    });

    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
    expect(screen.getByText("CIF-982341")).toBeInTheDocument();
    expect(screen.getByText("123 Financial Way")).toBeInTheDocument();
  });

  it("switches tabs correctly", async () => {
    profileService.getProfile.mockResolvedValue(mockProfile);
    profileService.getProfileHistory.mockResolvedValue(mockHistory);

    render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Profile Settings")).toBeInTheDocument();
    });

    const contactTabButton = screen.getByRole("button", {
      name: "Contact Information",
    });
    fireEvent.click(contactTabButton);

    expect(screen.queryByText("Personal Profile")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Mailing Address/i)).toBeInTheDocument();
  });
});
