import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMortgageDetails } from "../services/api";
import LoanSummaryCard from "../components/mortgage/LoanSummaryCard";

export default function MortgageDetailsPage() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getMortgageDetails();
        setDetails(data);
      } catch (err) {
        setError("Failed to load mortgage details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-lg max-w-container-max mx-auto w-full">
        <div
          role="alert"
          className="p-md bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm flex items-center gap-sm"
        >
          <span className="material-symbols-outlined text-error">error</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
      {/* Page Header */}
      <div className="flex flex-col gap-xs mb-sm">
        <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface">
          Mortgage Account Details
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          First Mortgage Loan — Account #{details.loanNumber}
        </p>
      </div>

      {/* Loan Summary Card */}
      <LoanSummaryCard
        details={details}
        onMakePaymentClick={() => navigate("/make-payment")}
      />

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-lg">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -z-10 group-hover:scale-110 transition-transform opacity-50"></div>
          <div className="flex justify-between items-start mb-sm">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">percent</span>
            </div>
            <span className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded-full font-label-md text-[10px] uppercase tracking-wide">
              Fixed Rate
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Interest Rate
          </p>
          <p className="font-headline-lg text-headline-lg text-on-surface">
            {details.interestRate}%
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -z-10 group-hover:scale-110 transition-transform opacity-50"></div>
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-sm">
            <span className="material-symbols-outlined">shield</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Escrow Balance{" "}
            <span className="text-xs opacity-70">(Taxes &amp; Ins)</span>
          </p>
          <p className="font-headline-lg text-headline-lg text-on-surface">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(details.escrowBalance)}
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -z-10 group-hover:scale-110 transition-transform opacity-50"></div>
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-sm">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Loan Term
          </p>
          <p className="font-headline-md text-headline-md text-on-surface">
            30-Year Fixed
          </p>
          <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
            Maturity Date: May 1, 2050
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Recent Activity
          </h2>
          <button
            onClick={() => navigate("/scheduled-payments")}
            className="text-primary hover:text-primary-container font-label-md text-label-md flex items-center gap-xs"
          >
            View Scheduled Payments{" "}
            <span className="material-symbols-outlined text-[16px]">
              arrow_forward
            </span>
          </button>
        </div>
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
              <tr className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors group cursor-default">
                <td className="p-md whitespace-nowrap">May 1, 2026</td>
                <td className="p-md font-body-sm text-body-sm font-medium">
                  Regular Payment
                </td>
                <td className="p-md text-right font-medium">$1,250.00</td>
                <td className="p-md text-center">
                  <span className="inline-flex items-center gap-xs px-2 py-1 bg-[#F0FDF4] text-[#166534] rounded-full font-label-md text-[11px] uppercase tracking-wide border border-[#DCFCE7]">
                    <span className="material-symbols-outlined text-[14px]">
                      check_circle
                    </span>
                    Completed
                  </span>
                </td>
              </tr>
              <tr className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors group cursor-default">
                <td className="p-md whitespace-nowrap">Apr 1, 2026</td>
                <td className="p-md font-body-sm text-body-sm font-medium">
                  Regular Payment
                </td>
                <td className="p-md text-right font-medium">$1,250.00</td>
                <td className="p-md text-center">
                  <span className="inline-flex items-center gap-xs px-2 py-1 bg-[#F0FDF4] text-[#166534] rounded-full font-label-md text-[11px] uppercase tracking-wide border border-[#DCFCE7]">
                    <span className="material-symbols-outlined text-[14px]">
                      check_circle
                    </span>
                    Completed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-lowest transition-colors group cursor-default">
                <td className="p-md whitespace-nowrap">Mar 1, 2026</td>
                <td className="p-md font-body-sm text-body-sm font-medium">
                  Regular Payment
                </td>
                <td className="p-md text-right font-medium">$1,250.00</td>
                <td className="p-md text-center">
                  <span className="inline-flex items-center gap-xs px-2 py-1 bg-[#F0FDF4] text-[#166534] rounded-full font-label-md text-[11px] uppercase tracking-wide border border-[#DCFCE7]">
                    <span className="material-symbols-outlined text-[14px]">
                      check_circle
                    </span>
                    Completed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
