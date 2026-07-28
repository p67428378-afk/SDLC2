import React from "react";
import { Check } from "lucide-react";

export default function StepIndicator({ currentStep }) {
  const steps = [
    { number: 1, label: "Enter Details" },
    { number: 2, label: "Review Payment" },
    { number: 3, label: "Confirmation" },
  ];

  return (
    <div className="flex items-center justify-center w-full max-w-2xl mx-auto mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {/* Step Circle */}
          <div className="flex flex-col items-center relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                currentStep > step.number
                  ? "bg-emerald-600 text-white"
                  : currentStep === step.number
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {currentStep > step.number ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <span className="text-xs font-medium text-slate-500 mt-2 absolute -bottom-6 whitespace-nowrap">
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                currentStep > step.number ? "bg-emerald-600" : "bg-slate-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
