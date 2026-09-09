import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import CheckoutPage from "./pages/CheckoutPage";
import RefundPortalPage from "./pages/RefundPortalPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/checkout" replace />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/refunds" element={<RefundPortalPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/checkout" replace />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4">
            <p>
              © {new Date().getFullYear()} PayGateway Service. PCI-DSS Level 1
              Merchant Security.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
