import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Clock, Shield, User, Lock, Mail, AlertCircle } from "lucide-react";

export default function AuthCard() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [role, setRole] = useState("Employee");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (type) => {
    if (type === "employee") {
      setEmail("test@example.com");
      setPassword("testpassword");
      setRole("Employee");
    } else {
      setEmail("admin@example.com");
      setPassword("adminpassword");
      setRole("Manager");
    }
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        const user = await register(email, password, role);
        if (user.role === "Manager") {
          navigate("/manager");
        } else {
          navigate("/employee");
        }
      } else {
        const user = await login(email, password);
        if (user.role === "Manager") {
          navigate("/manager");
        } else {
          navigate("/employee");
        }
      }
    } catch (err) {
      setFormError(
        err.message || "Authentication failed. Please check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-3">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Timesheet Tracker</h2>
        <p className="text-blue-100 text-sm mt-1">
          {isRegister
            ? "Create an account to start logging hours"
            : "Sign in to access your dashboard"}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {/* Test Credentials Banner */}
        <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
          <div className="font-semibold mb-1 flex items-center">
            <Shield className="w-3.5 h-3.5 mr-1 text-primary" />
            <span>Test Accounts (Seeded)</span>
          </div>
          <div className="text-blue-800 leading-relaxed">
            <div>
              <span className="font-medium">Employee:</span> test@example.com /
              testpassword
            </div>
            <div>
              <span className="font-medium">Manager:</span> admin@example.com /
              adminpassword
            </div>
          </div>
          <div className="mt-2.5 flex space-x-2">
            <button
              type="button"
              onClick={() => handleQuickFill("employee")}
              className="px-2.5 py-1 bg-white border border-blue-300 rounded text-xs font-medium text-blue-700 hover:bg-blue-50 transition"
            >
              Fill Employee
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("manager")}
              className="px-2.5 py-1 bg-white border border-blue-300 rounded text-xs font-medium text-blue-700 hover:bg-blue-50 transition"
            >
              Fill Manager
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setFormError("");
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
              !isRegister
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setFormError("");
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
              isRegister
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Notification */}
        {formError && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-xs text-red-700"
          >
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium text-gray-700 mb-1"
              htmlFor="email-input"
            >
              Email Address
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-medium text-gray-700 mb-1"
              htmlFor="password-input"
            >
              Password
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                htmlFor="role-select"
              >
                Account Role
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="Employee">Employee (Log Hours)</option>
                  <option value="Manager">Manager (Approve & Manage)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition"
          >
            {submitting
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
