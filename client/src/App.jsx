import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2663eb] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#707a8c]">
            Loading TimeTrack Pro...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If an employee tries to access manager route, redirect to employee dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafc]">
        <div className="w-8 h-8 border-4 border-[#2663eb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "Manager") {
    return <Navigate to="/manager/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7fafc] text-[#171c29]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute requiredRole="Manager">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/projects"
            element={
              <ProtectedRoute requiredRole="Manager">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-[#171c29]">
                  404 - Page Not Found
                </h2>
                <p className="text-sm text-[#707a8c] mt-2">
                  The page you are looking for does not exist.
                </p>
                <a
                  href="/"
                  className="inline-block mt-4 px-4 py-2 bg-[#2663eb] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Return to Dashboard
                </a>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
