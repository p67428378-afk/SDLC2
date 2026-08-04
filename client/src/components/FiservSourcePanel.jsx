import React, { useState } from "react";

export default function FiservSourcePanel({ rawSource, raw_source }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Accept rawSource or raw_source
  const data = rawSource !== undefined ? rawSource : raw_source;

  // Acceptance Criterion 3: In mock mode (or missing raw_source), section does not appear at all
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return null;
  }

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy source data:", err);
    }
  };

  return (
    <section className="mt-8 border-t border-outline-variant pt-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline-md text-lg mb-4 w-full text-left focus:outline-none cursor-pointer"
        aria-expanded={isExpanded}
      >
        <span className="font-bold">View Fiserv Source Data</span>
        <span
          className={`material-symbols-outlined text-sm transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          id="inspector-chevron"
        >
          arrow_drop_down
        </span>
      </button>

      {isExpanded && (
        <div
          id="inspector-content"
          className="bg-slate-950 bg-slate-900 text-slate-100 rounded-xl border border-tertiary-container border-slate-800 shadow-lg overflow-hidden transition-all duration-300"
        >
          <div className="flex justify-between items-center bg-tertiary-container/50 bg-slate-800/80 px-4 py-3 border-b border-tertiary-container border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-sm">
                  code
                </span>
                <span className="font-label-sm text-label-sm text-slate-200 tracking-wide font-semibold">
                  Unmodified Fiserv API Payload
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-slate-400 text-xs mt-1">
                Proves UI values are dynamically derived from upstream Fiserv
                responses
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-300 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-700 flex items-center gap-1 text-xs"
              title="Copy JSON to clipboard"
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? "check" : "content_copy"}
              </span>
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div className="p-4 overflow-x-auto max-h-96">
            <pre className="font-label-md text-label-md text-emerald-400 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
