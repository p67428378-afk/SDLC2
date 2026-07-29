import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PreferencesForm from "./PreferencesForm";
import profileService from "../../services/profileService";

vi.mock("../../services/profileService", () => ({
  default: {
    updateProfile: vi.fn(),
  },
}));

describe("PreferencesForm Component", () => {
  const mockProfile = {
    email: "test@example.com",
    phone: "1234567890",
    address: "123 Financial Way, Suite 100, New York, NY 10001",
    preferences: {
      paperless: true,
      email_notifications: true,
      sms_notifications: false,
      marketing_opt_in: false,
    },
  };

  it("renders checkboxes with initial values", () => {
    render(<PreferencesForm profile={mockProfile} />);
    expect(screen.getByLabelText(/paperless statements/i)).toBeChecked();
    expect(screen.getByLabelText(/email notifications/i)).toBeChecked();
    expect(screen.getByLabelText(/sms notifications/i)).not.toBeChecked();
    expect(
      screen.getByLabelText(/marketing communications/i),
    ).not.toBeChecked();
  });

  it("submits preferences successfully", async () => {
    const mockUpdatedProfile = {
      ...mockProfile,
      preferences: {
        ...mockProfile.preferences,
        sms_notifications: true,
      },
    };
    profileService.updateProfile.mockResolvedValueOnce(mockUpdatedProfile);
    const handleSuccess = vi.fn();

    render(
      <PreferencesForm profile={mockProfile} onUpdateSuccess={handleSuccess} />,
    );

    const smsCheckbox = screen.getByLabelText(/sms notifications/i);
    fireEvent.click(smsCheckbox);

    const submitButton = screen.getByRole("button", {
      name: /save preferences/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith({
        email: "test@example.com",
        phone: "1234567890",
        address: "123 Financial Way, Suite 100, New York, NY 10001",
        preferences: {
          paperless: true,
          email_notifications: true,
          sms_notifications: true,
          marketing_opt_in: false,
        },
      });
      expect(handleSuccess).toHaveBeenCalledWith(mockUpdatedProfile);
      expect(
        screen.getByText(/preferences updated successfully/i),
      ).toBeInTheDocument();
    });
  });
});
