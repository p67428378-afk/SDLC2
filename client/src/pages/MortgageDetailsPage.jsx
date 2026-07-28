import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, CreditCard, CalendarRange, AlertCircle } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import LoanInfoGrid from "../components/mortgage/LoanInfoGrid";
import PaymentHistoryTable from "../components/mortgage/PaymentHistoryTable";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import { mortgageService } from "../services/api";

export default function MortgageDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mortgage, setMortgage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const mortgageId = id || "MTG-88492";
        const [detailsData, historyData] = await Promise.all([
          mortgageService.getDetails(mortgageId),
          mortgageService.getPaymentHistory(mortgageId),
        ]);
        setMortgage(detailsData);
        setHistory(historyData);
      } catch (err) {
        setError("Failed to load mortgage details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Mortgage Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Mortgage Details">
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mortgage Details">
      <div className="space-y-8">
        {/* Hero Card */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Home className="w-8 h-8 text-emerald-600 bg-emerald-50 p-1.5 rounded-lg" />
                <h3 className="text-2xl font-bold text-slate-800">
                  First Mortgage Loan
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Account: •••• {mortgage?.loanNumber?.slice(-4) || "8492"}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Outstanding Balance
              </p>
              <h2 className="text-4xl font-extrabold text-slate-900">
                $
                {mortgage?.outstandingBalance?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </h2>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl flex flex-col items-end gap-4 min-w-[300px]">
              <div className="text-right w-full">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Next Payment Due
                </p>
                <p className="text-xl font-bold text-slate-800">
                  $
                  {mortgage?.minimumPaymentDue?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs font-medium text-red-600 mt-1">
                  Due on {mortgage?.nextPaymentDueDate}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => navigate("/make-payment")}
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4" />
                  Make Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/scheduled-payments")}
                  className="flex-1"
                >
                  <CalendarRange className="w-4 h-4" />
                  Schedules
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Loan Details Grid */}
        <LoanInfoGrid mortgage={mortgage} />

        {/* Recent Payment History */}
        <PaymentHistoryTable history={history} />
      </div>
    </AppLayout>
  );
}
