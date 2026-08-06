import React from "react";

export default function SecuritySettingsPlaceholder() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant border-dashed p-8 shadow-sm flex flex-col items-center justify-center text-center opacity-80 min-h-[300px]">
      <span className="material-symbols-outlined text-4xl text-outline mb-4">
        lock_clock
      </span>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
        Password Management
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Security features coming in Phase 4...
      </p>
      <span className="mt-4 px-3 py-1 bg-surface-container-high text-on-surface-variant font-label-sm rounded-full">
        Phase 4
      </span>
      <div className="w-full h-px bg-outline-variant/30 my-4"></div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Need to reset your password now? Contact us.
      </p>
      <div className="flex gap-6 mt-2">
        <a
          className="flex items-center gap-2 text-primary font-body-sm text-body-sm hover:opacity-80 transition-opacity font-medium"
          href="tel:1-800-555-0100"
        >
          <span className="material-symbols-outlined text-sm">phone</span>
          1-800-555-0100
        </a>
        <a
          className="flex items-center gap-2 text-primary font-body-sm text-body-sm hover:opacity-80 transition-opacity font-medium"
          href="mailto:support@tfsbank.com"
        >
          <span className="material-symbols-outlined text-sm">mail</span>
          support@tfsbank.com
        </a>
      </div>
    </div>
  );
}
