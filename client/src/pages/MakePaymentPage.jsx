import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { dashboardService } from "../services/api";
import { paymentService } from "../services/paymentService";

export default function MakePaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mortgageId = searchParams.get("id");

  const [mortgage, setMortgage] = useState(null);
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mortgageId) {
      setError("No mortgage account specified.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const mortDetails = await dashboardService.getAccountDetail(
          "cenlar",
          mortgageId,
        );
        setMortgage(mortDetails);
        setAmount(mortDetails.next_payment_amount.toString());

        const eligibleSources =
          await paymentService.getPaymentSources(mortgageId);
        setSources(eligibleSources);
        if (eligibleSources.length > 0) {
          setSelectedSourceId(eligibleSources[0].id);
        }
      } catch (err) {
        setError("Failed to load payment details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mortgageId]);

  const selectedSource = sources.find((s) => s.id === selectedSourceId);
  const parsedAmount = parseFloat(amount) || 0;
  const hasSufficientFunds = selectedSource
    ? selectedSource.balance >= parsedAmount
    : false;
  const isAmountValid = parsedAmount > 0;

  const handleReview = () => {
    if (!selectedSourceId) {
      alert("Please select a payment source account.");
      return;
    }
    if (!isAmountValid) {
      alert("Please enter a valid positive payment amount.");
      return;
    }
    if (!hasSufficientFunds) {
      alert("Insufficient funds in the selected source account.");
      return;
    }

    navigate("/payment-review", {
      state: {
        mortgageId,
        sourceId: selectedSourceId,
        amount: parsedAmount,
        sourceAccount: selectedSource,
        mortgageAccount: mortgage,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm text-center">
          <span className="material-symbols-outlined text-error text-5xl">
            error
          </span>
          <h2 className="mt-4 text-xl font-bold text-on-surface">Error</h2>
          <p className="mt-2 text-secondary">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 bg-primary text-on-primary font-label-md py-2 px-4 rounded-xl hover:bg-primary-container transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <header className="mb-8">
        <h2 className="font-headline-md text-2xl font-bold text-on-surface">
          Make Mortgage Payment
        </h2>
        <p className="font-body-md text-secondary mt-1">
          Complete your monthly transaction securely.
        </p>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8-col) */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">
                payment
              </span>
              <h3 className="font-title-lg text-lg font-semibold">
                Payment Details
              </h3>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Source Account */}
              <div className="space-y-2">
                <label className="block font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Select Payment Source Account
                </label>
                <div className="relative">
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full h-12 bg-surface-container-low border border-outline-variant rounded-lg px-4 font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    {sources.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.name} ({src.account_number}) - Available Balance: $
                        {src.balance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <label className="block font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Payment Amount ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-mono-numeric">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-12 bg-surface-container-low border border-outline-variant rounded-lg pl-8 pr-4 font-mono-numeric text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-label-md text-xs text-secondary">
                    Next payment due: $
                    {mortgage?.next_payment_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {selectedSource && (
                    <div className="flex items-center gap-1">
                      {hasSufficientFunds ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <span className="material-symbols-outlined text-sm">
                            check_circle
                          </span>
                          <span className="font-label-md text-xs">
                            Sufficient funds available.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <span className="material-symbols-outlined text-sm">
                            error
                          </span>
                          <span className="font-label-md text-xs">
                            Insufficient funds in source account.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleReview}
                  disabled={!isAmountValid || !hasSufficientFunds}
                  className="px-6 h-12 bg-primary text-on-primary font-title-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-100 shadow-md"
                >
                  Review Payment
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/details?source=cenlar&id=${mortgageId}`)
                  }
                  className="px-6 h-12 bg-white border border-error text-error font-title-lg rounded-lg hover:bg-red-50 transition-all active:scale-95 duration-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          {/* Informational Alert */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-primary mt-0.5">
              info
            </span>
            <div>
              <p className="font-body-md text-on-surface font-semibold">
                Payment Processing Note
              </p>
              <p className="font-body-md text-secondary text-sm mt-0.5">
                Payments made before 5:00 PM EST will be processed same-day.
                Late fees may apply if payment is received after the grace
                period.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4-col) */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">
                summarize
              </span>
              <h3 className="font-title-lg text-lg font-semibold">
                Mortgage Summary
              </h3>
            </div>
            <div className="space-y-4">
              <div className="pb-4 border-b border-outline-variant">
                <p className="font-label-md text-xs text-secondary uppercase">
                  Account
                </p>
                <p className="font-body-lg font-semibold text-on-surface">
                  {mortgage?.name}
                </p>
                <p className="font-body-md text-secondary text-sm">
                  {mortgage?.account_number}
                </p>
              </div>
              <div className="pb-4 border-b border-outline-variant">
                <p className="font-label-md text-xs text-secondary uppercase">
                  Principal Balance
                </p>
                <p className="font-mono-numeric text-lg font-bold text-on-surface">
                  $
                  {mortgage?.principal_balance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="pb-4 border-b border-outline-variant">
                <p className="font-label-md text-xs text-secondary uppercase">
                  Next Payment Due
                </p>
                <p className="font-mono-numeric text-lg font-bold text-on-surface">
                  $
                  {mortgage?.next_payment_amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="font-label-md text-xs text-secondary uppercase">
                  Due Date
                </p>
                <p className="font-body-lg text-on-surface">
                  {mortgage?.next_payment_due}
                </p>
              </div>
            </div>
          </section>

          {/* Image Card */}
          <div className="relative overflow-hidden rounded-xl h-64 border border-outline-variant shadow-sm group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBdu2XMgLECKjU0A2KWb5gfwz4OTl-wMhz4ln6NLmYHgpnoTLV-PIJEx5sRMzhz9AxPw5eH0Gpz9RwFQM87zXI22LXXu6kVaRCQZH4gRBaCc8-fCblg2HDDW9ObTGe9hS-1YvCvJ0Os8Znq7ZisJ_-SoI_CHCggSXLUA_qyKxX3HauxxFLqMX6ovm1BhTpvZxdjCPYSM-zDtSp8xAlrxTlfwlI6WBFcozi8SkGNQGH7Q_wfgqwvoGmOZuVTOSSgaMBxHRoMeXHEjag')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
              <p className="text-white font-semibold text-lg">
                Protect your investment
              </p>
              <p className="text-white/80 text-sm mt-1">
                Learn about our home insurance options tailored for
                institutional clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
