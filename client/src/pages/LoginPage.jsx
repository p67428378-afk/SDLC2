import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function LoginPage() {
  const [username, setUsername] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-md md:p-xl min-h-[80vh]">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col gap-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-xl mx-auto mb-sm">
            N
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Nexus Bank
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            Sign in to access your online banking platform
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-md bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-error">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div>
            <label
              htmlFor="username"
              className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs"
            >
              Username / Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 px-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="p-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface-variant">
            <p className="font-semibold text-on-surface mb-xs">
              Test Credentials
            </p>
            <p>
              Username: <span className="font-mono">test@example.com</span>
            </p>
            <p>
              Password: <span className="font-mono">testpassword</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-[#4338CA] transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
            <span className="material-symbols-outlined text-[20px]">login</span>
          </button>
        </form>
      </div>
    </div>
  );
}
