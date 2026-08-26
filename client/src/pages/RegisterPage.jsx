import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Clock,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, role);
      setSuccessMsg("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
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
          Create a New Account
        </h2>
        <p className="mt-2 text-center text-sm text-[#707a8c]">
          Join TimeTrack Pro as an Employee or Manager
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-[#e3e8f0]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200"
              >
                {error}
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200"
              >
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#171c29] mb-1">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("Employee")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                    role === "Employee"
                      ? "border-[#2663eb] bg-blue-50/50 text-[#2663eb] ring-2 ring-[#2663eb]/20"
                      : "border-[#e3e8f0] hover:bg-gray-50 text-[#707a8c]"
                  }`}
                >
                  <UserCheck className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">Employee</span>
                  <span className="text-[10px] opacity-75">
                    Log weekly hours
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("Manager")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                    role === "Manager"
                      ? "border-[#2663eb] bg-blue-50/50 text-[#2663eb] ring-2 ring-[#2663eb]/20"
                      : "border-[#e3e8f0] hover:bg-gray-50 text-[#707a8c]"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">Manager</span>
                  <span className="text-[10px] opacity-75">
                    Approve & Manage
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-[#171c29] mb-1"
              >
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-[#e3e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb]"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-[#171c29] mb-1"
              >
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-[#e3e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb]"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-semibold text-[#171c29] mb-1"
              >
                Confirm Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-[#e3e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2663eb]/20 focus:border-[#2663eb]"
                  placeholder="Re-enter your password"
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
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#707a8c]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#2663eb] hover:underline"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
