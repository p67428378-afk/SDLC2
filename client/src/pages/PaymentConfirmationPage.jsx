import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentSuccessCard from "../components/mortgage/PaymentSuccessCard";
import { getPaymentReceipt } from "../services/api";

export default function PaymentConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="p-lg max-w-container-max mx-auto w-full text-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-md">
          No payment confirmation details found.
        </p>
        <button
          onClick={() => navigate("/")}
          className="h-12 px-xl bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-[#4338CA] transition-colors"
        >
          Go to Mortgage Details
        </button>
      </div>
    );
  }

  const handleDownloadReceipt = async () => {
    try {
      const receipt = await getPaymentReceipt(result.transactionId);
      // Create a simple text file download as a mock receipt
      const element = document.createElement("a");
      const file = new Blob(
        [
          `NEXUS BANK MORTGAGE PAYMENT RECEIPT\n`,
          `==================================\n`,
          `Receipt ID: ${receipt.receiptId}\n`,
          `Transaction ID: ${receipt.transactionId}\n`,
          `Date: ${receipt.date}\n`,
          `Amount: $${receipt.amount.toFixed(2)}\n`,
          `Status: ${receipt.status}\n`,
          `==================================\n`,
          `Thank you for your payment!\n`,
        ],
        { type: "text/plain" },
      );
      element.href = URL.createObjectURL(file);
      element.download = `receipt-${receipt.receiptId}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      alert("Failed to download receipt. Please try again.");
    }
  };

  return (
    <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <PaymentSuccessCard
        result={result}
        onDownloadReceipt={handleDownloadReceipt}
        onGoToDetails={() => navigate("/")}
      />
    </div>
  );
}
