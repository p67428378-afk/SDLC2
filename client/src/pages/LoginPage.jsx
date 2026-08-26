import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Clock,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (userData.role === "Manager") {
        navigate("/manager/dashboard", { replace: true });
      } else {
        navigate(from === "/login" ? "/dashboard" : from, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Login failed. Please check your credentials.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const setTestAccount = (testEmail, testPass) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError("");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#f7fafc]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-[#2663eb] flex items-center justify-center text-white shadow-md">
            <Clock className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-[#171c29]">
          Sign in to TimeTrack Pro
        </h2>
        <p className="mt-2 text-center text-sm text-[#707a8c]">
          Enter your credentials to access your timesheet dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-[#e3e8f0]">
          {/* Pre-fill Quick Selection Banner */}
          <div className="mb-6 p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">
              💡 Quick-fill Seed Test Accounts:
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setTestAccount("test@example.com", "testpassword")
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white border border-blue-300 rounded text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" /> Employee
              </button>
              <button
                type="button"
                onClick={() =>
                  setTestAccount("manager@example.com", "testpassword")
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white border border-blue-300 rounded text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Manager
              </button>
            </div>
            <p className="mt-2 text-[11px] text-blue-700/90 text-center">
              Test password: <code>testpassword</code>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#171c29] mb-1"
              >
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-[#e3e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb]"
                  placeholder="employee@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#171c29] mb-1"
              >
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-[#e3e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#2663eb] hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2663eb] disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#707a8c]">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#2663eb] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
