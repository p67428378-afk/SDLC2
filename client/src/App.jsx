import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AccountSummaryPage from "./pages/AccountSummaryPage";
import RelationshipOverviewPage from "./pages/RelationshipOverviewPage";
import AccountDetailPage from "./pages/AccountDetailPage";
import { authService } from "./services/api";

function ProtectedRoute({ children }) {
  return authService.isAuthenticated() ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <AccountSummaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relationship"
          element={
            <ProtectedRoute>
              <RelationshipOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/details"
          element={
            <ProtectedRoute>
              <AccountDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
