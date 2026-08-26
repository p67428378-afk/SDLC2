import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import RegisterPage from "./RegisterPage";
import * as AuthContext from "../context/AuthContext";

describe("RegisterPage Component", () => {
  it("renders registration form with role selection and input fields", () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      register: vi.fn(),
      loading: false,
    });

    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Create a New Account/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Select Your Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register/i }),
    ).toBeInTheDocument();
  });

  it("validates matching passwords", async () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      register: vi.fn(),
      loading: false,
    });

    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "newuser@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "password456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    expect(
      await screen.findByText(/Passwords do not match/i),
    ).toBeInTheDocument();
  });
});
