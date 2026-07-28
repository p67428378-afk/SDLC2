import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getScheduledPayments } from "../services/api";
import ScheduledPaymentsTable from "../components/mortgage/ScheduledPaymentsTable";

export default function ScheduledPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await getScheduledPayments();
        setPayments(data);
      } catch (err) {
        setError("Failed to load scheduled payments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
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
      <div className="flex flex-col gap-xs mb-sm">
        <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface">
          Scheduled Payments
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          View and manage your upcoming mortgage payments.
        </p>
      </div>

      <ScheduledPaymentsTable payments={payments} />

      <div className="flex justify-start mt-md">
        <button
          onClick={() => navigate("/")}
          className="h-12 px-xl border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-sm"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
          Back to Mortgage Details
        </button>
      </div>
    </div>
  );
}
