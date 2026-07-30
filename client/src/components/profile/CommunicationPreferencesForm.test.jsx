import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CommunicationPreferencesForm from "./CommunicationPreferencesForm";

describe("CommunicationPreferencesForm", () => {
  const mockProfile = {
    address: "123 Financial Way",
    phone: "1234567890",
    email: "test@example.com",
    preferences: {
      email_notif: true,
      marketing: false,
      paperless: true,
      sms_notif: false,
    },
  };

  const mockOnSaveSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders checkboxes with initial values", () => {
    render(
      <CommunicationPreferencesForm
        profile={mockProfile}
        onSaveSuccess={mockOnSaveSuccess}
      />,
    );

    expect(screen.getByLabelText(/Paperless Statements/i)).toBeChecked();
    expect(screen.getByLabelText(/Email Notifications/i)).toBeChecked();
    expect(screen.getByLabelText(/SMS Notifications/i)).not.toBeChecked();
    expect(
      screen.getByLabelText(/Marketing Communications/i),
    ).not.toBeChecked();
  });

  it("submits form successfully with updated values", async () => {
    mockOnSaveSuccess.mockResolvedValue({});
    render(
      <CommunicationPreferencesForm
        profile={mockProfile}
        onSaveSuccess={mockOnSaveSuccess}
      />,
    );

    const smsCheckbox = screen.getByLabelText(/SMS Notifications/i);
    fireEvent.click(smsCheckbox);

    const submitButton = screen.getByRole("button", {
      name: /Save Preferences/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSaveSuccess).toHaveBeenCalledWith({
        address: "123 Financial Way",
        phone: "1234567890",
        email: "test@example.com",
        preferences: {
          paperless: true,
          email_notif: true,
          sms_notif: true,
          marketing: false,
        },
      });
    });

    expect(
      screen.getByText("Preferences updated successfully"),
    ).toBeInTheDocument();
  });
});
