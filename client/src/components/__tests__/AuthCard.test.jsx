import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import AuthCard from "../AuthCard";

// Wrapper helper
const renderAuthCard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AuthCard />
      </AuthProvider>
    </BrowserRouter>,
  );
};

describe("AuthCard Component", () => {
  it("renders login form with default test credentials and quick fill buttons", () => {
    renderAuthCard();

    expect(screen.getByText("Timesheet Tracker")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue(
      "test@example.com",
    );
    expect(screen.getByLabelText(/Password/i)).toHaveValue("testpassword");

    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    expect(signInButtons.length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Fill Employee/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Fill Manager/i }),
    ).toBeInTheDocument();
  });

  it("switches between Sign In and Register tabs", () => {
    renderAuthCard();

    const registerTab = screen.getByRole("button", { name: /^Register$/i });
    fireEvent.click(registerTab);

    expect(screen.getByLabelText(/Account Role/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Account/i }),
    ).toBeInTheDocument();

    const signInTab = screen.getByRole("button", { name: /^Sign In$/i });
    fireEvent.click(signInTab);

    expect(screen.queryByLabelText(/Account Role/i)).not.toBeInTheDocument();
  });

  it("populates manager test credentials on Fill Manager button click", () => {
    renderAuthCard();

    const fillManagerBtn = screen.getByRole("button", {
      name: /Fill Manager/i,
    });
    fireEvent.click(fillManagerBtn);

    expect(screen.getByLabelText(/Email Address/i)).toHaveValue(
      "admin@example.com",
    );
    expect(screen.getByLabelText(/Password/i)).toHaveValue("adminpassword");
  });
});
