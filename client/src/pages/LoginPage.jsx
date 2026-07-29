import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import Button from "../components/common/Button";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("123456");
  const [step, setStep] = useState(1); // 1: Login, 2: MFA
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      if (data.mfa_token) {
        setMfaToken(data.mfa_token);
        setStep(2);
      } else {
        setError("MFA token not received from server.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.detail || "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.verifyMfa(mfaCode, mfaToken);
      navigate("/");
    } catch (err) {
      console.error("MFA verification error:", err);
      setError(err.response?.data?.detail || "Invalid or expired MFA code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1326] text-[#dae2fd] px-md">
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
            Wealth Management Portal
          </p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 text-error p-sm rounded-lg text-body-md text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-sm">
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="username"
                className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
              >
                Username / Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-surface rounded-lg px-sm py-xs text-on-surface focus:outline-none w-full"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label
                htmlFor="password"
                className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-surface rounded-lg px-sm py-xs text-on-surface focus:outline-none w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full mt-xs py-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="mt-sm p-sm bg-surface-container-high/50 rounded-lg border border-outline-variant text-center">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                Test Credentials
              </p>
              <p className="font-body-md text-on-surface font-medium">
                Email: <span className="text-primary">test@example.com</span>
              </p>
              <p className="font-body-md text-on-surface font-medium">
                Password: <span className="text-primary">testpassword</span>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="flex flex-col gap-sm">
            <div className="flex flex-col gap-xs text-center mb-xs">
              <p className="font-body-md text-on-surface-variant">
                An MFA code has been sent to your registered device.
              </p>
            </div>

            <div className="flex flex-col gap-xs">
              <label
                htmlFor="mfa-code"
                className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center"
              >
                Enter 6-Digit MFA Code
              </label>
              <input
                id="mfa-code"
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
                className="input-surface rounded-lg px-sm py-xs text-on-surface focus:outline-none text-center text-headline-sm tracking-widest w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full mt-xs py-sm"
            >
              {loading ? "Verifying..." : "Verify & Proceed"}
            </Button>

            <div className="mt-sm p-sm bg-surface-container-high/50 rounded-lg border border-outline-variant text-center">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                Test MFA Code
              </p>
              <p className="font-body-md text-on-surface font-medium">
                Code: <span className="text-primary">123456</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-primary hover:underline font-label-md text-label-md text-center mt-xs"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
