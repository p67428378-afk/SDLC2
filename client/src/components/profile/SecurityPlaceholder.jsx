import React from "react";

export default function SecurityPlaceholder() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h3 className="font-headline-md text-lg font-bold text-on-surface mb-4">
        Security Settings
      </h3>
      <div className="border border-dashed border-outline-variant rounded-xl p-8 text-center flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-outline text-5xl">
          lock_person
        </span>
        <h4 className="font-headline-sm text-base font-bold text-on-surface">
          Password Management (Phase 4)
        </h4>
        <p className="font-body-sm text-xs text-on-surface-variant max-w-md">
          Security features, including password changes and multi-factor
          authentication settings, are scheduled for implementation in Phase 4.
        </p>
        <div className="mt-2 bg-surface-container-low text-secondary px-4 py-1.5 rounded-full font-label-sm text-xs border border-outline-variant">
          Security features coming in Phase 4
        </div>
      </div>
    </div>
  );
}
