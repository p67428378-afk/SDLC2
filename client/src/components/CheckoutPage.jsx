import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import CurrencySelector from "./CurrencySelector";
import {
  createCheckoutSession,
  payWithDigitalWallet,
  getExchangeRates,
} from "../services/api";

// Luhn Algorithm for Credit Card Checksum Validation
const isValidLuhn = (cardNumber) => {
  const sanitized = cardNumber.replace(/\D/g, "");
  if (!sanitized || sanitized.length < 13 || sanitized.length > 19)
    return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

export const CheckoutPage = () => {
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState({
    USD: 1.0,
    EUR: 0.925,
    GBP: 0.79,
    JPY: 155.0,
    CAD: 1.36,
  });
  const [loadingRates, setLoadingRates] = useState(false);

  // Form State
  const [customerEmail, setCustomerEmail] = useState("customer@example.com");
  const [cardholderName, setCardholderName] = useState("Jane Doe");
  const [cardNumber, setCardNumber] = useState("4242424242424242"); // Standard Stripe test card
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("2028");
  const [cvv, setCvv] = useState("123");

  // Validation & UI State
  const [cardError, setCardError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successModalData, setSuccessModalData] = useState(null);

  const baseAmount = 49.99;
  const currentRate = rates[currency] || 1.0;
  const convertedAmount = Number((baseAmount * currentRate).toFixed(2));

  // Fetch Exchange Rates on Mount / Currency Change
  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const data = await getExchangeRates("USD");
      if (data && data.rates) {
        setRates(data.rates);
      }
    } catch (err) {
      console.warn("Using fallback exchange rates:", err);
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(val);
    if (val.length >= 13) {
      if (!isValidLuhn(val)) {
        setCardError("Invalid card number checksum (Luhn check failed)");
      } else {
        setCardError("");
      }
    } else {
      setCardError("");
    }
  };

  const handleCardPayment = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!isValidLuhn(cardNumber)) {
      setCardError("Please enter a valid credit card number");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        amount: baseAmount,
        currency: currency,
        customer_email: customerEmail,
        items: [
          {
            name: "Pro Subscription (Monthly)",
            quantity: 1,
            unit_price: baseAmount,
          },
        ],
      };

      const result = await createCheckoutSession(payload);
      setSuccessModalData({
        type: "card",
        title: "Payment Successful!",
        sessionId: result.session_id,
        paymentIntentId: result.payment_intent_id,
        baseAmount: result.base_amount,
        baseCurrency: result.base_currency,
        targetAmount: result.target_amount,
        targetCurrency: result.target_currency,
        exchangeRate: result.exchange_rate,
        customerEmail,
      });
    } catch (err) {
      setApiError(
        err.message || "Payment processing failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDigitalWallet = async (walletType) => {
    setApiError("");
    setIsSubmitting(true);

    try {
      const payload = {
        wallet_type: walletType,
        payment_token: `tok_wallet_${walletType}_${Date.now()}`,
        currency: currency,
        amount: convertedAmount,
        customer_email: customerEmail,
      };

      const result = await payWithDigitalWallet(payload);
      setSuccessModalData({
        type: walletType,
        title: `${walletType === "apple_pay" ? "Apple Pay" : "Google Pay"} Authorized!`,
        transactionId: result.transaction_id,
        paymentIntentId: result.payment_intent_id,
        targetAmount: result.amount,
        targetCurrency: result.currency,
        status: result.status,
        customerEmail,
      });
    } catch (err) {
      setApiError(
        err.message || `${walletType} payment failed. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-indigo-600" />
          Checkout & Payment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete your purchase securely in your preferred currency.
        </p>
      </div>

      {apiError && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Payment Error:</span> {apiError}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Express Buttons & Card Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Digital Wallets Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Express Digital Checkout
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDigitalWallet("apple_pay")}
                className="flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-medium text-sm transition-all shadow hover:shadow-md disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4" />
                <span>Apple Pay</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDigitalWallet("google_pay")}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-medium text-sm transition-all shadow hover:shadow-md border border-slate-700 disabled:opacity-50"
              >
                <span className="font-bold text-blue-400">G</span>Pay
              </button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">
                  Or pay with credit card
                </span>
              </div>
            </div>

            {/* Credit Card Form */}
            <form onSubmit={handleCardPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="block w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="block w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">
                    Card Number
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Luhn checksum verified
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className={`block w-full rounded-lg border px-3 py-2 text-sm font-mono focus:ring-indigo-500 ${
                      cardError
                        ? "border-rose-300 bg-rose-50/30"
                        : "border-slate-300"
                    }`}
                    placeholder="4242 4242 4242 4242"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
                {cardError && (
                  <p className="text-xs text-rose-600 mt-1">{cardError}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Exp Month
                  </label>
                  <select
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 border px-2.5 py-2 text-sm focus:ring-indigo-500"
                  >
                    {Array.from({ length: 12 }, (_, i) =>
                      String(i + 1).padStart(2, "0"),
                    ).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Exp Year
                  </label>
                  <select
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 border px-2.5 py-2 text-sm focus:ring-indigo-500"
                  >
                    {["2025", "2026", "2027", "2028", "2029", "2030"].map(
                      (y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 border px-3 py-2 text-sm font-mono focus:ring-indigo-500"
                    placeholder="123"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || Boolean(cardError)}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authorizing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Pay {currency} {convertedAmount.toFixed(2)}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary & Currency Selector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              Order Summary
            </h2>

            <div className="border-t border-b border-slate-100 py-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Pro Subscription (Monthly)
                </span>
                <span className="text-slate-900 font-semibold">
                  ${baseAmount.toFixed(2)} USD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Includes all PCI payment features and analytics access.
              </p>
            </div>

            {/* Currency Selector */}
            <CurrencySelector
              selectedCurrency={currency}
              onCurrencyChange={setCurrency}
              exchangeRates={rates}
              loadingRates={loadingRates}
              onRefreshRates={fetchRates}
            />

            <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Base Total (USD):</span>
                <span className="font-medium text-slate-700">
                  ${baseAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Exchange Rate ({currency}):</span>
                <span className="font-medium text-slate-700">
                  {currentRate.toFixed(4)}
                </span>
              </div>
              <div className="border-t border-indigo-100 pt-2 flex justify-between items-center text-base font-bold text-slate-900">
                <span>Total Due:</span>
                <span className="text-indigo-600 text-lg">
                  {currency} {convertedAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                256-Bit SSL Encryption • PCI-DSS Level 1 Certified
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSuccessModalData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {successModalData.title}
              </h3>
              <p className="text-xs text-slate-500">
                Receipt sent to{" "}
                <span className="font-semibold text-slate-700">
                  {successModalData.customerEmail}
                </span>
              </p>
            </div>

            <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Intent:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                  {successModalData.paymentIntentId}
                </span>
              </div>
              {successModalData.sessionId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Session ID:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                    {successModalData.sessionId}
                  </span>
                </div>
              )}
              {successModalData.transactionId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                    {successModalData.transactionId}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-sans text-sm font-bold">
                <span>Amount Paid:</span>
                <span className="text-emerald-600">
                  {successModalData.targetCurrency}{" "}
                  {successModalData.targetAmount?.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSuccessModalData(null)}
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
