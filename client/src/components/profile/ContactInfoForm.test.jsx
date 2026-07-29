import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ContactInfoForm from "./ContactInfoForm";
import profileService from "../../services/profileService";

vi.mock("../../services/profileService", () => ({
  default: {
    updateProfile: vi.fn(),
  },
}));

describe("ContactInfoForm Component", () => {
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

  it("renders form fields with initial values", () => {
    render(<ContactInfoForm profile={mockProfile} />);
    expect(screen.getByLabelText(/email address/i)).toHaveValue(
      "test@example.com",
    );
    expect(screen.getByLabelText(/phone number/i)).toHaveValue("1234567890");
    expect(screen.getByLabelText(/mailing address/i)).toHaveValue(
      "123 Financial Way, Suite 100, New York, NY 10001",
    );
  });

  it("shows validation errors for invalid inputs", async () => {
    render(<ContactInfoForm profile={mockProfile} />);

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    expect(
      await screen.findByText(/please enter a valid email address/i),
    ).toBeInTheDocument();
  });

  it("submits form successfully", async () => {
    const mockUpdatedProfile = { ...mockProfile, email: "new@example.com" };
    profileService.updateProfile.mockResolvedValueOnce(mockUpdatedProfile);
    const handleSuccess = vi.fn();

    render(
      <ContactInfoForm profile={mockProfile} onUpdateSuccess={handleSuccess} />,
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith({
        email: "new@example.com",
        phone: "1234567890",
        address: "123 Financial Way, Suite 100, New York, NY 10001",
        preferences: mockProfile.preferences,
      });
      expect(handleSuccess).toHaveBeenCalledWith(mockUpdatedProfile);
      expect(
        screen.getByText(/profile updated successfully/i),
      ).toBeInTheDocument();
    });
  });
});
