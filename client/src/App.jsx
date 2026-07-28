import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MortgageDetailsPage from "./pages/MortgageDetailsPage";
import MakePaymentPage from "./pages/MakePaymentPage";
import PaymentReviewPage from "./pages/PaymentReviewPage";
import PaymentConfirmationPage from "./pages/PaymentConfirmationPage";
import ScheduledPaymentsPage from "./pages/ScheduledPaymentsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Something went wrong. Check console.</h2>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#3525cd",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reset &amp; Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex min-h-screen bg-background text-on-background font-body-md text-body-md antialiased">
                  <Navbar />
                  <div className="flex-1 flex flex-col min-h-screen md:ml-[260px] relative">
                    <header className="flex items-center justify-between px-lg w-full h-[64px] bg-surface dark:bg-surface border-b border-outline-variant dark:border-outline z-10 sticky top-0">
                      <div className="flex items-center gap-md">
                        <div className="hidden sm:flex items-center gap-sm font-body-sm text-body-sm text-on-surface-variant">
                          <span className="text-on-surface font-medium">
                            Nexus Bank Online Banking
                          </span>
                        </div>
                      </div>
                    </header>
                    <main className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
                      <Routes>
                        <Route path="/" element={<MortgageDetailsPage />} />
                        <Route
                          path="/make-payment"
                          element={<MakePaymentPage />}
                        />
                        <Route
                          path="/payment-review"
                          element={<PaymentReviewPage />}
                        />
                        <Route
                          path="/payment-confirmation"
                          element={<PaymentConfirmationPage />}
                        />
                        <Route
                          path="/scheduled-payments"
                          element={<ScheduledPaymentsPage />}
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
