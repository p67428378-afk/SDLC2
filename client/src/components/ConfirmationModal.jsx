import React from "react";

export default function ConfirmationModal({ isOpen, onClose, submission }) {
  if (!isOpen || !submission) return null;

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return "";
    try {
      return (
        new Date(isoStr).toISOString().replace("T", " ").substring(0, 19) +
        " UTC"
      );
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-4"
      id="successModal"
    >
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div class="p-lg">
          <div class="flex items-center justify-center w-12 h-12 bg-primary-fixed rounded-full mb-md mx-auto">
            <span
              class="material-symbols-outlined text-primary text-[24px]"
              data-icon="check_circle"
              data-weight="fill"
            >
              check_circle
            </span>
          </div>
          <h2 class="font-headline-sm text-headline-sm font-bold text-center text-on-surface mb-sm">
            Assortment Changes Submitted
          </h2>
          <p class="font-body-sm text-body-sm text-center text-on-surface-variant mb-lg">
            Assortment changes for Small Town Value cluster have been
            successfully submitted for approval.
          </p>
          <div class="bg-surface p-md rounded border border-outline-variant/30 mb-lg font-label-sm text-label-sm space-y-xs">
            <div class="flex justify-between">
              <span class="text-secondary uppercase">Submission ID:</span>
              <span class="text-on-surface font-medium">{submission.id}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary uppercase">Scenario:</span>
              <span class="text-on-surface font-medium">
                {submission.scenario_name}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary uppercase">Submitted By:</span>
              <span class="text-on-surface font-medium">
                {submission.submitted_by}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary uppercase">Audit Trail ID:</span>
              <span class="text-on-surface font-medium">
                {submission.audit_trail_id}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary uppercase">Status:</span>
              <span class="text-on-surface font-medium">
                {submission.status}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary uppercase">Timestamp:</span>
              <span class="text-on-surface font-medium">
                {formatTimestamp(submission.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            class="w-full bg-surface border border-outline-variant text-on-surface font-label-md text-label-md font-medium py-2 px-4 rounded hover:bg-surface-variant/20 transition-colors"
            id="closeModalBtn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
