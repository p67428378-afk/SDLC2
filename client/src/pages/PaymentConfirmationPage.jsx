import React from "react";
import { useNavigate } from "react-router-dom";
import PaymentSuccessCard from "../components/mortgage/PaymentSuccessCard";

export default function PaymentConfirmationPage({ receipt }) {
  const navigate = useNavigate();

  if (!receipt) {
    // Redirect back if no receipt is present
    React.useEffect(() => {
      navigate("/");
    }, [navigate]);
    return null;
  }

  return (
    <div className="flex-1 p-md md:p-xl max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <PaymentSuccessCard
        receipt={receipt}
        onDone={() => navigate("/")}
        onViewScheduled={() => navigate("/scheduled")}
      />
    </div>
  );
}
