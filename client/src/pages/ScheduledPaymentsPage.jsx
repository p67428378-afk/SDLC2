import React, { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { dashboardService } from "../services/api";
import { paymentService } from "../services/paymentService";

export default function ScheduledPaymentsPage() {
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [mortgages, setMortgages] = useState([]);
  const [bankingAccounts, setBankingAccounts] = useState([]);

  // Form state
  const [selectedMortgageId, setSelectedMortgageId] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const [scheduled, dash] = await Promise.all([
        paymentService.getScheduledPayments(),
        dashboardService.getDashboard(),
      ]);

      setScheduledPayments(scheduled);
      setMortgages(dash.accounts.mortgages);

      // Filter checking (DDA) and savings accounts only
      const eligibleSources = dash.accounts.deposits.filter(
        (acc) => acc.type === "DDA" || acc.type === "Savings",
      );
      setBankingAccounts(eligibleSources);

      if (dash.accounts.mortgages.length > 0) {
        setSelectedMortgageId(dash.accounts.mortgages[0].id);
      }
      if (eligibleSources.length > 0) {
        setSelectedSourceId(eligibleSources[0].id);
      }
    } catch (err) {
      setError("Failed to load scheduled payments data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!selectedMortgageId || !selectedSourceId || !amount || !scheduledDate) {
      alert("Please fill in all fields.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    // Validate date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(scheduledDate + "T00:00:00");
    if (selectedDateObj <= today) {
      alert("Scheduled date must be in the future.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = {
        mortgage_account_id: selectedMortgageId,
        source_account_id: selectedSourceId,
        amount: parsedAmount,
        scheduled_date: scheduledDate,
      };

      await paymentService.schedulePayment(payload);
      setSuccessMessage("Payment scheduled successfully!");
      setAmount("");
      setScheduledDate("");

      // Refresh list
      const updatedScheduled = await paymentService.getScheduledPayments();
      setScheduledPayments(updatedScheduled);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail || "Failed to schedule payment.";
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (paymentId) => {
    if (
      !window.confirm("Are you sure you want to cancel this scheduled payment?")
    ) {
      return;
    }

    setError("");
    setSuccessMessage("");
    try {
      await paymentService.cancelScheduledPayment(paymentId);
      setSuccessMessage("Scheduled payment cancelled successfully.");

      // Refresh list
      const updatedScheduled = await paymentService.getScheduledPayments();
      setScheduledPayments(updatedScheduled);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail || "Failed to cancel scheduled payment.";
      setError(errMsg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">
            Loading scheduled payments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <header className="mb-8">
        <h2 className="font-headline-md text-2xl font-bold text-text-primary">
          Scheduled Payments
        </h2>
        <p className="font-body-md text-text-secondary mt-1">
          Schedule future one-time payments and manage pending ones.
        </p>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start text-red-800 mb-6">
          <span className="material-symbols-outlined text-red-600">error</span>
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3 items-start text-green-800 mb-6">
          <span className="material-symbols-outlined text-green-600">
            check_circle
          </span>
          <div>
            <p className="font-semibold">Success</p>
            <p className="text-sm mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule Form (5-col) */}
        <div className="lg:col-span-5">
          <section className="bg-card-background border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">
                calendar_month
              </span>
              <h3 className="font-title-lg text-lg font-semibold text-text-primary">
                Schedule New Payment
              </h3>
            </div>

            <form className="space-y-4" onSubmit={handleSchedule}>
              {/* Select Mortgage */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Select Mortgage Account
                </label>
                <select
                  value={selectedMortgageId}
                  onChange={(e) => setSelectedMortgageId(e.target.value)}
                  className="w-full h-12 bg-page-background border border-border rounded-lg px-4 font-body-md text-text-primary focus:ring-2 focus:ring-focus-ring focus:border-focus-ring transition-all"
                >
                  {mortgages.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.account_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Source Account */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Select Source Account
                </label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full h-12 bg-page-background border border-border rounded-lg px-4 font-body-md text-text-primary focus:ring-2 focus:ring-focus-ring focus:border-focus-ring transition-all"
                >
                  {bankingAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.account_number}) - Balance: $
                      {b.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-12 bg-page-background border border-border rounded-lg px-4 font-mono-numeric text-text-primary focus:ring-2 focus:ring-focus-ring focus:border-focus-ring transition-all"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full h-12 bg-page-background border border-border rounded-lg px-4 font-body-md text-text-primary focus:ring-2 focus:ring-focus-ring focus:border-focus-ring transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-primary text-white font-title-lg rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all duration-100 shadow-md"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">schedule</span>
                    Schedule Payment
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Scheduled Payments List (7-col) */}
        <div className="lg:col-span-7">
          <section className="bg-card-background border border-border rounded-xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">
                list_alt
              </span>
              <h3 className="font-title-lg text-lg font-semibold text-text-primary">
                Pending Scheduled Payments
              </h3>
            </div>

            {scheduledPayments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl">
                <span className="material-symbols-outlined text-text-secondary text-5xl">
                  event_busy
                </span>
                <p className="mt-4 text-text-primary font-semibold">
                  No Scheduled Payments
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  You don't have any pending scheduled payments at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                {scheduledPayments.map((payment) => {
                  const mortgage = mortgages.find(
                    (m) => m.id === payment.mortgage_account_id,
                  );
                  const source = bankingAccounts.find(
                    (b) => b.id === payment.source_account_id,
                  );

                  return (
                    <div
                      key={payment.id}
                      className="p-4 border border-border rounded-xl hover:bg-page-background transition-colors flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-body-lg font-semibold text-text-primary">
                            $
                            {payment.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                            {payment.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          From:{" "}
                          <span className="font-semibold text-text-primary">
                            {source?.name || "Deposit Account"}
                          </span>{" "}
                          ({payment.source_account_id})
                        </p>
                        <p className="text-xs text-text-secondary">
                          To:{" "}
                          <span className="font-semibold text-text-primary">
                            {mortgage?.name || "Mortgage Account"}
                          </span>{" "}
                          ({payment.mortgage_account_id})
                        </p>
                        <p className="text-xs text-text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">
                            calendar_today
                          </span>
                          Scheduled for:{" "}
                          <span className="font-semibold text-text-primary">
                            {payment.scheduled_date}
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleCancel(payment.id)}
                        className="px-3 py-1.5 border border-error text-error hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          cancel
                        </span>
                        Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
