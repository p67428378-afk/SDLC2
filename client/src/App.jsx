import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage";
import ManagerDashboardPage from "./pages/ManagerDashboardPage";
import ManagerProjectsPage from "./pages/ManagerProjectsPage";

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-gray-500">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If an Employee attempts to access Manager-only routes, redirect to Employee Dashboard
    if (user?.role === "Employee") {
      return <Navigate to="/employee" replace />;
    }
    // If unauthorized for any other reason, redirect to default
    return <Navigate to="/" replace />;
  }

  return children;
}

// Default Root Redirector based on user role
function RootRedirect() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-gray-500">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "Manager") {
    return <Navigate to="/manager" replace />;
  }

  return <Navigate to="/employee" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/employee"
            element={
              <ProtectedRoute>
                <EmployeeDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager"
            element={
              <ProtectedRoute requiredRole="Manager">
                <ManagerDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/projects"
            element={
              <ProtectedRoute requiredRole="Manager">
                <ManagerProjectsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
