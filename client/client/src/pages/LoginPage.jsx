import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [step, setStep] = useState("login"); // 'login' or 'mfa'
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
        setStep("mfa");
      } else {
        setError("MFA token not received from server.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.verifyMfa(mfaToken, mfaCode);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid MFA code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm">
        <div>
          <div className="flex justify-center">
            <span className="material-symbols-outlined text-primary text-5xl">
              account_balance
            </span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-on-surface">
            ApexUnion Bank
          </h2>
          <p className="mt-2 text-center text-sm text-secondary">
            {step === "login"
              ? "Sign in to your unified dashboard"
              : "Multi-Factor Authentication"}
          </p>
        </div>

        {error && (
          <div
            className="bg-error-container/10 border border-error text-error px-4 py-3 rounded-xl text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {step === "login" ? (
          <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-outline-variant placeholder-outline text-on-surface focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-outline-variant placeholder-outline text-on-surface focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-on-primary bg-primary hover:bg-primary-container hover:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="mt-4 p-4 bg-surface-container rounded-xl border border-outline-variant text-xs text-secondary">
              <p className="font-semibold text-on-surface mb-1">
                Test Credentials:
              </p>
              <p>
                Email:{" "}
                <span className="font-mono text-on-surface">
                  test@example.com
                </span>
              </p>
              <p>
                Password:{" "}
                <span className="font-mono text-on-surface">testpassword</span>
              </p>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="mfa-code"
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  Enter 6-digit MFA Code
                </label>
                <input
                  id="mfa-code"
                  name="code"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength="6"
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-outline-variant placeholder-outline text-on-surface focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm text-center tracking-widest text-lg font-bold"
                  placeholder="123456"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-on-primary bg-primary hover:bg-primary-container hover:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {loading ? "Verifying..." : "Verify MFA"}
              </button>
            </div>

            <div className="mt-4 p-4 bg-surface-container rounded-xl border border-outline-variant text-xs text-secondary">
              <p className="font-semibold text-on-surface mb-1">
                MFA Bypass Code:
              </p>
              <p>
                Use static code:{" "}
                <span className="font-mono text-on-surface font-bold">
                  123456
                </span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
