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
  const [mfaCodeLoading, setMfaCodeLoading] = useState(false);
  const [retrievedCode, setRetrievedCode] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

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

  const handleGetMfaCode = async () => {
    setError("");
    setMfaCodeLoading(true);
    try {
      const data = await authService.getMfaCode(username);
      if (data && data.code) {
        setRetrievedCode(data.code);
        setShowModal(true);
      } else {
        setError("Failed to retrieve MFA code.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "User not found for this email");
    } finally {
      setMfaCodeLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (retrievedCode) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(retrievedCode).catch(() => {});
      }
      setMfaCode(retrievedCode); // auto-fill for convenience
      setCopyToast(true);
      setTimeout(() => {
        setCopyToast(false);
      }, 2000);
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
    <div className="min-h-screen flex items-center justify-center bg-page-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-md w-full space-y-8 bg-card-background p-8 border border-border rounded-xl shadow-sm z-10">
        <div>
          <div className="flex justify-center">
            <span className="material-symbols-outlined text-primary text-5xl">
              account_balance
            </span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            ApexUnion Bank
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            {step === "login"
              ? "Sign in to your unified dashboard"
              : `Multi-Factor Authentication for ${username}`}
          </p>
        </div>

        {error && (
          <div
            className="bg-error/10 border border-error text-error px-4 py-3 rounded-xl text-sm"
            role="alert"
            data-testid="error-alert"
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
                  className="block text-sm font-medium text-text-secondary mb-1"
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
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-border placeholder-text-secondary text-text-primary focus:outline-none focus:ring-focus-ring focus:border-focus-ring focus:z-10 sm:text-sm"
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-secondary mb-1"
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
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-border placeholder-text-secondary text-text-primary focus:outline-none focus:ring-focus-ring focus:border-focus-ring focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus-ring disabled:opacity-50 transition-colors"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="mt-4 p-4 bg-page-background rounded-xl border border-border text-xs text-text-secondary">
              <p className="font-semibold text-text-primary mb-1">
                Test Credentials:
              </p>
              <p>
                Email:{" "}
                <span className="font-mono text-text-primary">
                  test@example.com
                </span>
              </p>
              <p>
                Password:{" "}
                <span className="font-mono text-text-primary">
                  testpassword
                </span>
              </p>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="mfa-code"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Enter 6-digit MFA Code
                </label>
                <input
                  id="mfa-code"
                  data-testid="mfa-code-input"
                  name="code"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength="6"
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-border placeholder-text-secondary text-text-primary focus:outline-none focus:ring-focus-ring focus:border-focus-ring focus:z-10 sm:text-sm text-center tracking-widest text-lg font-bold"
                  placeholder="000000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                data-testid="verify-mfa-btn"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus-ring disabled:opacity-50 transition-colors font-bold uppercase"
              >
                {loading ? "Verifying..." : "Verify MFA"}
              </button>

              <button
                type="button"
                id="get-code-btn"
                data-testid="get-mfa-code-btn"
                onClick={handleGetMfaCode}
                disabled={mfaCodeLoading}
                className="w-full py-2.5 px-4 border border-primary text-primary hover:bg-red-50 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
              >
                {mfaCodeLoading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></span>
                    Retrieving Code...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      sms
                    </span>
                    Get MFA Code
                  </>
                )}
              </button>
            </div>

            <p className="font-body-sm text-xs text-text-secondary text-center italic bg-page-background p-3 rounded-lg border border-dashed border-border">
              Click "Get MFA Code" to generate a 6-digit verification code.
            </p>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep("login");
                  setError("");
                }}
                className="text-xs text-text-secondary hover:text-primary underline"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MFA Code Modal / Pop-up Display */}
      {showModal && (
        <div
          data-testid="mfa-code-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-card-background border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4 text-center relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-text-secondary hover:text-text-primary text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-text-primary">
              Your MFA Code
            </h3>
            <p className="text-xs text-text-secondary">
              Generated for <span className="font-semibold">{username}</span>
            </p>
            <div className="bg-page-background p-4 rounded-xl border border-border">
              <span
                data-testid="mfa-code-display"
                className="font-mono text-4xl font-extrabold tracking-widest text-primary"
              >
                {retrievedCode}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Valid for 5 minutes. Max 3 verification attempts.
            </p>

            <button
              type="button"
              id="copy-btn"
              data-testid="copy-code-btn"
              onClick={handleCopyCode}
              className="w-full py-2 px-4 bg-primary text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-base">
                content_copy
              </span>
              {copyToast ? "Copied to Field!" : "Copy to Clipboard & Fill"}
            </button>

            {copyToast && (
              <div
                data-testid="copy-toast"
                className="bg-green-600 text-white text-xs py-1 px-3 rounded-full inline-block mt-2 font-semibold"
              >
                ✓ Code copied & filled into MFA field!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
