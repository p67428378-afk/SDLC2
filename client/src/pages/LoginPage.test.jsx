import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "./LoginPage";
import * as AuthContext from "../context/AuthContext";

describe("LoginPage Component", () => {
  it("renders login form and prefilled test credentials", () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      login: vi.fn(),
      loading: false,
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Sign in to TimeTrack Pro/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue(
      "test@example.com",
    );
    expect(screen.getByLabelText(/Password/i)).toHaveValue("testpassword");
    expect(
      screen.getByRole("button", { name: /Sign In/i }),
    ).toBeInTheDocument();
  });

  it("updates form inputs when quick fill buttons are clicked", () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      login: vi.fn(),
      loading: false,
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const managerBtn = screen.getByRole("button", { name: /Manager/i });
    fireEvent.click(managerBtn);

    expect(screen.getByLabelText(/Email Address/i)).toHaveValue(
      "manager@example.com",
    );
  });
});
