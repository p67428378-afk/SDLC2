import React from "react";

export default function ApprovalReviewPanel({
  selectedScenario,
  scenarioData,
  onSubmit,
  submitting,
  error,
}) {
  const actions = scenarioData?.sku_actions || [];
  const guardrails = scenarioData?.guardrails || {
    private_brand_pass: true,
    shelf_capacity_pass: true,
  };

  return (
    <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-lg flex flex-col h-full">
      <h3 class="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant/50 pb-sm mb-md">
        Approval Review Panel
      </h3>

      <div class="mb-md bg-surface p-sm rounded border border-outline-variant/30 flex items-center justify-between">
        <span class="font-label-sm text-label-sm text-secondary uppercase">
          Selected Scenario:
        </span>
        <span class="font-label-md text-label-md font-bold text-on-surface">
          {selectedScenario}
        </span>
      </div>

      <div class="mb-lg flex-1">
        <h4 class="font-label-sm text-label-sm text-secondary uppercase mb-sm">
          Proposed Actions
        </h4>
        {actions.length === 0 ? (
          <p class="text-sm text-secondary italic">
            No actions proposed for this scenario.
          </p>
        ) : (
          <ul class="space-y-sm">
            {actions.map((act, idx) => (
              <li
                key={idx}
                class="flex items-start gap-sm font-body-sm text-body-sm"
              >
                {act.action_type === "ADD" ? (
                  <span
                    class="material-symbols-outlined text-primary text-[18px]"
                    data-icon="add_circle"
                    data-weight="fill"
                  >
                    add_circle
                  </span>
                ) : (
                  <span
                    class="material-symbols-outlined text-error text-[18px]"
                    data-icon="remove_circle"
                    data-weight="fill"
                  >
                    remove_circle
                  </span>
                )}
                <span>
                  <strong class="font-medium">{act.action_type}:</strong>{" "}
                  {act.product_name} ({act.sku_id})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div class="mb-lg">
        <h4 class="font-label-sm text-label-sm text-secondary uppercase mb-sm">
          Guardrail Checks
        </h4>
        <ul class="space-y-xs">
          <li class="flex items-center justify-between font-body-sm text-body-sm">
            <span>Private Brand Target Met</span>
            {guardrails.private_brand_pass ? (
              <span
                class="material-symbols-outlined text-primary text-[18px]"
                data-icon="check"
                data-weight="fill"
              >
                check
              </span>
            ) : (
              <span
                class="material-symbols-outlined text-error text-[18px]"
                data-icon="close"
                data-weight="fill"
              >
                close
              </span>
            )}
          </li>
          <li class="flex items-center justify-between font-body-sm text-body-sm">
            <span>Shelf Capacity Limit</span>
            {guardrails.shelf_capacity_pass ? (
              <span
                class="material-symbols-outlined text-primary text-[18px]"
                data-icon="check"
                data-weight="fill"
              >
                check
              </span>
            ) : (
              <span
                class="material-symbols-outlined text-error text-[18px]"
                data-icon="close"
                data-weight="fill"
              >
                close
              </span>
            )}
          </li>
        </ul>
      </div>

      {error && (
        <div class="mb-md p-sm bg-error-container text-on-error-container text-xs rounded border border-error/20">
          {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={submitting}
        class="w-full bg-primary-container text-on-primary-fixed-variant font-label-md text-label-md font-bold py-3 px-4 rounded hover:bg-primary-fixed-dim transition-colors mt-auto flex justify-center items-center gap-2 disabled:opacity-50"
        id="submitBtn"
      >
        {submitting ? "Submitting..." : "Submit for Approval"}
        <span
          class="material-symbols-outlined text-[18px]"
          data-icon="send"
          data-weight="fill"
        >
          send
        </span>
      </button>
    </div>
  );
}
