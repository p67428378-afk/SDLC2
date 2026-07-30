import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";

export default function PaymentConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { receipt, sourceAccount, mortgageAccount } = location.state || {};

  if (!location.state || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-background">
        <div className="max-w-md w-full bg-card-background p-8 border border-border rounded-xl shadow-sm text-center space-y-6">
          <span className="material-symbols-outlined text-error text-5xl">
            error
          </span>
          <h2 className="mt-4 text-xl font-bold text-text-primary">
            Invalid State
          </h2>
          <p className="mt-2 text-text-secondary">No payment receipt found.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 bg-primary text-white font-label-md py-2 px-4 rounded-xl hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto bg-card-background border border-border rounded-xl p-8 shadow-sm text-center space-y-6">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success">
          <span className="material-symbols-outlined text-4xl">
            check_circle
          </span>
        </div>

        <div>
          <h2 className="font-headline-md text-2xl font-bold text-text-primary">
            Payment Successful!
          </h2>
          <p className="font-body-md text-text-secondary mt-1">
            Your mortgage payment has been processed successfully.
          </p>
        </div>

        {/* Receipt Details */}
        <div className="bg-page-background rounded-xl p-6 text-left space-y-4">
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-secondary text-sm font-medium">
              Confirmation Number
            </span>
            <span className="text-text-primary font-mono font-semibold">
              {receipt.confirmation_number}
            </span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-secondary text-sm font-medium">
              Amount Paid
            </span>
            <span className="text-text-primary font-mono-numeric font-bold">
              $
              {receipt.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-secondary text-sm font-medium">
              Source Account
            </span>
            <span className="text-text-primary font-semibold">
              {sourceAccount?.name || "Deposit Account"} (
              {sourceAccount?.account_number || receipt.source_account_id})
            </span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-text-secondary text-sm font-medium">
              Payment Date
            </span>
            <span className="text-text-primary font-semibold">
              {new Date(receipt.payment_date).toLocaleString()}
            </span>
          </div>

          {/* Updated Balances */}
          <div className="pt-2 space-y-2">
            <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">
              Updated Balances
            </p>
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm font-medium">
                Source Account Balance
              </span>
              <span className="text-text-primary font-mono-numeric font-semibold">
                $
                {receipt.updated_source_balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm font-medium">
                Mortgage Principal Balance
              </span>
              <span className="text-text-primary font-mono-numeric font-semibold">
                $
                {receipt.updated_mortgage_balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 h-12 bg-primary text-white font-title-lg rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-100 shadow-md"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() =>
              navigate(
                `/details?source=cenlar&id=${receipt.mortgage_account_id}`,
              )
            }
            className="flex-1 h-12 bg-white border border-border text-text-secondary font-title-lg rounded-lg hover:bg-page-background transition-all active:scale-95 duration-100"
          >
            View Mortgage Details
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
