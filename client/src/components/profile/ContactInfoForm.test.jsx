import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ContactInfoForm from "./ContactInfoForm";

describe("ContactInfoForm", () => {
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

  it("renders form with initial values", () => {
    render(
      <ContactInfoForm
        profile={mockProfile}
        onSaveSuccess={mockOnSaveSuccess}
      />,
    );

    expect(screen.getByLabelText(/Mailing Address/i)).toHaveValue(
      "123 Financial Way",
    );
    expect(screen.getByLabelText(/Phone Number/i)).toHaveValue("1234567890");
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue(
      "test@example.com",
    );
  });

  it("shows validation errors on invalid input blur", async () => {
    render(
      <ContactInfoForm
        profile={mockProfile}
        onSaveSuccess={mockOnSaveSuccess}
      />,
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    expect(screen.getByText("Invalid email format")).toBeInTheDocument();

    const phoneInput = screen.getByLabelText(/Phone Number/i);
    fireEvent.change(phoneInput, { target: { value: "123" } });
    fireEvent.blur(phoneInput);

    expect(
      screen.getByText("Phone number must be exactly 10 digits"),
    ).toBeInTheDocument();
  });

  it("submits form successfully when valid", async () => {
    mockOnSaveSuccess.mockResolvedValue({});
    render(
      <ContactInfoForm
        profile={mockProfile}
        onSaveSuccess={mockOnSaveSuccess}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSaveSuccess).toHaveBeenCalledWith({
        address: "123 Financial Way",
        phone: "1234567890",
        email: "test@example.com",
        preferences: mockProfile.preferences,
      });
    });

    expect(
      screen.getByText("Profile updated successfully"),
    ).toBeInTheDocument();
  });
});
