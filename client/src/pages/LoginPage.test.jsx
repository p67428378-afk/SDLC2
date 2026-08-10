import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import { authService } from "../services/api";

vi.mock("../services/api", () => ({
    authService: {
        login: vi.fn(),
        getMfaCode: vi.fn(),
        verifyMfa: vi.fn(),
    },
}));

describe("LoginPage Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders login form by default", () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );
        expect(screen.getByText("A Banking Company")).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /sign in/i }),
        ).toBeInTheDocument();
    });

    it("switches to MFA step after successful login", async () => {
        authService.login.mockResolvedValueOnce({
            mfa_token: "mock-mfa-token",
        });

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByTestId("get-mfa-code-btn")).toBeInTheDocument();
        });
    });

    it("calls getMfaCode and displays code modal on success", async () => {
        authService.login.mockResolvedValueOnce({
            mfa_token: "mock-mfa-token",
        });
        authService.getMfaCode.mockResolvedValueOnce({ code: "849201" });

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByTestId("get-mfa-code-btn")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("get-mfa-code-btn"));

        await waitFor(() => {
            expect(authService.getMfaCode).toHaveBeenCalledWith(
                "test@example.com",
            );
            expect(screen.getByTestId("mfa-code-display")).toHaveTextContent(
                "849201",
            );
        });
    });

    it("displays error message when getMfaCode fails with 404", async () => {
        authService.login.mockResolvedValueOnce({
            mfa_token: "mock-mfa-token",
        });
        authService.getMfaCode.mockRejectedValueOnce({
            response: {
                status: 404,
                data: { detail: "User not found for this email" },
            },
        });

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>,
        );

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByTestId("get-mfa-code-btn")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("get-mfa-code-btn"));

        await waitFor(() => {
            expect(screen.getByTestId("error-alert")).toHaveTextContent(
                "User not found for this email",
            );
        });
    });
});
