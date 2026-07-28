import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Printer, Home } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import StepIndicator from "../components/common/StepIndicator";
import Button from "../components/common/Button";

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const { paymentResult, paymentData, selectedAccount, mortgage } = state;

  useEffect(() => {
    if (!paymentResult) {
      navigate("/make-payment");
    }
  }, [paymentResult, navigate]);

  if (!paymentResult) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = paymentData.amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedBalance = paymentResult.updatedMortgageBalance.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

  return (
    <AppLayout title="Payment Confirmation">
      <div className="space-y-8 max-w-2xl mx-auto">
        <StepIndicator currentStep={3} />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
          {/* Success Header */}
          <div className="bg-emerald-50 border-b border-emerald-100 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-emerald-800">
              Payment Successful
            </h3>
            <p className="text-sm text-emerald-600 mt-1">
              Your payment has been processed and confirmed.
            </p>
          </div>

          {/* Receipt Details */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <span className="text-slate-500">Confirmation Number</span>
              <span className="font-mono font-bold text-slate-800 text-right">
                {paymentResult.confirmationNumber}
              </span>

              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono text-xs text-slate-500 text-right">
                {paymentResult.transactionId}
              </span>

              <span className="text-slate-500">Payment Date</span>
              <span className="font-semibold text-slate-800 text-right">
                {paymentData.paymentDate}
              </span>

              <span className="text-slate-500">Paid From</span>
              <span className="font-semibold text-slate-800 text-right">
                {selectedAccount?.accountName} (••••{" "}
                {selectedAccount?.maskedAccountNumber.slice(-4)})
              </span>

              <span className="text-slate-500">Amount Paid</span>
              <span className="font-bold text-slate-900 text-right">
                ${formattedAmount}
              </span>

              <div className="col-span-2 border-t border-slate-100 my-2"></div>

              <span className="text-slate-500 font-medium">
                Updated Mortgage Balance
              </span>
              <span className="font-bold text-emerald-700 text-right">
                ${formattedBalance}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 print:hidden">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </Button>
              <Button
                onClick={() => navigate(`/mortgage/${mortgage.id}`)}
                className="flex-1"
              >
                <Home className="w-4 h-4" />
                Back to Mortgage Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
