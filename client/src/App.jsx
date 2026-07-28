import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MortgageDetailsPage from "./pages/MortgageDetailsPage";
import MakePaymentPage from "./pages/MakePaymentPage";
import PaymentReviewPage from "./pages/PaymentReviewPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import ScheduledPaymentsPage from "./pages/ScheduledPaymentsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/mortgage/:id"
          element={
            <ProtectedRoute>
              <MortgageDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/make-payment"
          element={
            <ProtectedRoute>
              <MakePaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-review"
          element={
            <ProtectedRoute>
              <PaymentReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirmation"
          element={
            <ProtectedRoute>
              <ConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheduled-payments"
          element={
            <ProtectedRoute>
              <ScheduledPaymentsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallbacks */}
        <Route
          path="/dashboard"
          element={<Navigate to="/mortgage/MTG-88492" replace />}
        />
        <Route
          path="/"
          element={<Navigate to="/mortgage/MTG-88492" replace />}
        />
        <Route
          path="*"
          element={<Navigate to="/mortgage/MTG-88492" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
