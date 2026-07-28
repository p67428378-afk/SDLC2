import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import Button from "../components/common/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("000000");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("login"); // 'login' or 'mfa'

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      if (data.mfa_token) {
        setMfaToken(data.mfa_token);
        setStep("mfa");
      } else {
        setError("MFA token not received from server.");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authService.verifyMfa(mfaCode, mfaToken);
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setError("Access token not received from server.");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Invalid MFA code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1326] text-[#dae2fd] p-md">
      <div className="w-full max-w-md card-surface rounded-xl p-lg flex flex-col gap-md shadow-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-xs text-center">
          <img
            alt="ApexUnion Corporate Logo"
            className="h-12 w-auto mb-xs"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTsqgxUVd6QDHUTIsDOVc0V8Y8UECTiji-VEibmd7iJrfSGBVLbQ7PB89vYnyVKSL7JrpPE-S_5KbE0PYmeP3K9_iXJ3GzM16cE4Jtziv-ysy7iAiI0hjAw3snEK668WEkMeSkJISrC4QWTF2pD-71vVZwXB4AXNOqsZH8GUsdGU9Gm08TuuaYOFJ8fhzkO6VUlG-20BHZ1xETKHCj8Y34yCB9Wf6mfmXPTN2SWypm7ViuVLCBqIXGiPlWfgxy7vbpbb7zoIrq-TkI"
          />
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            ApexUnion
          </h1>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Wealth Management
          </p>
        </div>

        {error && (
          <div
            className="p-sm bg-error/10 border border-error/20 text-error rounded-lg text-body-md font-medium"
            role="alert"
          >
            {error}
          </div>
        )}

        {step === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label
                className="font-label-md text-on-surface-variant"
                htmlFor="username"
              >
                Username / Email
              </label>
              <input
                id="username"
                type="text"
                className="input-surface rounded-lg px-sm py-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container bg-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label
                className="font-label-md text-on-surface-variant"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-surface rounded-lg px-sm py-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container bg-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-xs">
              {loading ? "Logging in..." : "Sign In"}
            </Button>

            <div className="mt-xs p-sm bg-surface-container-high/50 rounded-lg border border-outline-variant text-center">
              <p className="font-label-md text-on-surface-variant">
                Test account:{" "}
                <span className="text-primary font-semibold">
                  test@example.com
                </span>{" "}
                /{" "}
                <span className="text-primary font-semibold">testpassword</span>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify} className="flex flex-col gap-md">
            <div className="text-center">
              <p className="font-body-md text-on-surface-variant mb-xs">
                An MFA verification code has been sent to your registered
                device.
              </p>
            </div>

            <div className="flex flex-col gap-xs">
              <label
                className="font-label-md text-on-surface-variant"
                htmlFor="mfaCode"
              >
                Verification Code
              </label>
              <input
                id="mfaCode"
                type="text"
                maxLength="6"
                className="input-surface rounded-lg px-sm py-xs text-on-surface text-center tracking-widest font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary-container bg-transparent"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-xs">
              {loading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="mt-xs p-sm bg-surface-container-high/50 rounded-lg border border-outline-variant text-center">
              <p className="font-label-md text-on-surface-variant">
                Default MFA Code:{" "}
                <span className="text-primary font-semibold">000000</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep("login")}
              className="text-primary hover:text-primary-container font-label-md text-label-md text-center transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
