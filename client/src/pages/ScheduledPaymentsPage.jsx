import React, { useEffect, useState } from "react";
import { Calendar, Plus, AlertCircle } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import ScheduledPaymentsTable from "../components/mortgage/ScheduledPaymentsTable";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Alert from "../components/common/Alert";
import { scheduledPaymentService, accountService } from "../services/api";

export default function ScheduledPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // Form fields
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("ONCE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [paymentsData, accountsData] = await Promise.all([
        scheduledPaymentService.listScheduled(),
        accountService.listAccounts(true),
      ]);
      setPayments(paymentsData);
      setAccounts(accountsData);
    } catch (err) {
      setError("Failed to load scheduled payments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingPayment(null);
    setSourceAccountId("");
    setAmount("");
    setFrequency("ONCE");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setIsActive(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (payment) => {
    setEditingPayment(payment);
    setSourceAccountId(payment.sourceAccountId);
    setAmount(payment.amount);
    setFrequency(payment.frequency);
    setStartDate(payment.startDate);
    setEndDate(payment.endDate || "");
    setIsActive(payment.isActive);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to cancel this scheduled payment?")
    ) {
      try {
        await scheduledPaymentService.deleteScheduled(id);
        fetchData();
      } catch (err) {
        setError("Failed to cancel scheduled payment.");
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        amount: parseFloat(amount),
        frequency,
        startDate,
        endDate: endDate || null,
        sourceAccountId,
        mortgageId: "MTG-88492",
      };

      if (editingPayment) {
        await scheduledPaymentService.updateScheduled(editingPayment.id, {
          amount: parseFloat(amount),
          frequency,
          startDate,
          endDate: endDate || null,
          isActive,
        });
      } else {
        await scheduledPaymentService.createScheduled(payload);
      }

      setIsOpen(false);
      fetchData();
    } catch (err) {
      setError("Failed to save scheduled payment. Please check your inputs.");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Scheduled Payments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Scheduled Payments">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Manage Scheduled Payments
            </h3>
            <p className="text-sm text-slate-500">
              Set up one-time or recurring mortgage payments.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            Schedule Payment
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <ScheduledPaymentsTable
          payments={payments}
          accounts={accounts}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsOpen(false)}
          title={
            editingPayment ? "Edit Scheduled Payment" : "Schedule New Payment"
          }
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Source Account */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Source Account
              </label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                disabled={!!editingPayment}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                <option value="">Select an account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} (•••• {acc.maskedAccountNumber.slice(-4)})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* Frequency */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                <option value="ONCE">One-Time</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* End Date */}
            {frequency !== "ONCE" && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            {/* Active Status (Edit only) */}
            {editingPayment && (
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-slate-700"
                >
                  Active
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
