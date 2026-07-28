import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mortgageService } from "../services/api";
import MortgageSummaryCard from "../components/mortgage/MortgageSummaryCard";
import LoanDetailsCard from "../components/mortgage/LoanDetailsCard";
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function MortgageDetailsPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await mortgageService.getPaymentHistory();
        setHistory(data);
      } catch (err) {
        setError("Failed to load payment history.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-sm">
        <div>
          <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface font-bold">
            Mortgage Account Details
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            First Mortgage Loan — Account #30049182
          </p>
        </div>
        <button
          onClick={() => navigate("/scheduled")}
          className="h-10 px-md border border-outline-variant text-primary font-label-md text-label-md rounded hover:bg-surface-container transition-colors flex items-center gap-sm"
        >
          <Calendar className="w-4 h-4" />
          Scheduled Payments
        </button>
      </div>

      {/* Row 1: Loan Summary Card */}
      <MortgageSummaryCard
        balance={245850.0}
        dueDate="June 1, 2026"
        minDue={1250.0}
        onMakePayment={() => navigate("/pay")}
      />

      {/* Row 2: 3-Column Grid */}
      <LoanDetailsCard
        interestRate={4.25}
        escrowBalance={4500.0}
        loanTerm="30-Year Fixed"
        maturityDate="May 1, 2050"
      />

      {/* Row 3: Recent Activity */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Recent Activity
          </h2>
        </div>
        {isLoading ? (
          <div className="p-xl flex justify-center items-center gap-sm">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-on-surface-variant">
              Loading payment history...
            </span>
          </div>
        ) : error ? (
          <div className="p-xl text-center text-error flex flex-col items-center gap-sm">
            <AlertCircle className="w-8 h-8" />
            <span>{error}</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">
            No recent payment activity found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Date
                  </th>
                  <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Description
                  </th>
                  <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="font-data-mono text-data-mono text-on-surface">
                {history.map((item) => (
                  <tr
                    key={item.paymentId}
                    className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors group cursor-default"
                  >
                    <td className="p-md whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-md font-body-sm text-body-sm font-medium">
                      {item.payment_type === "IMMEDIATE"
                        ? "Immediate Mortgage Payment"
                        : "Scheduled Mortgage Payment"}
                    </td>
                    <td className="p-md text-right font-medium font-mono">
                      $
                      {item.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-md text-center">
                      <span
                        className={`inline-flex items-center gap-xs px-2 py-1 rounded-full font-label-md text-[11px] uppercase tracking-wide border ${
                          item.status === "COMPLETED" ||
                          item.status === "SUCCESS"
                            ? "bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]"
                            : item.status === "FAILED"
                              ? "bg-error-container text-on-error-container border-error/20"
                              : "bg-surface-container-high text-primary border-outline-variant"
                        }`}
                      >
                        {item.status === "COMPLETED" ||
                        item.status === "SUCCESS" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
