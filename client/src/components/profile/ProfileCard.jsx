import React from "react";

export default function ProfileCard({ profile }) {
  const initials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase()
    : "JD";

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "Jane Doe";

  const cif = profile ? profile.cif : "CIF-982341";
  const rm = profile ? profile.relationship_manager : "Robert Vance";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center text-center">
      <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-display-lg text-3xl font-bold mb-4 border-4 border-surface-container-low shadow-sm">
        {initials}
      </div>
      <h3 className="font-headline-md text-xl font-bold text-on-surface mb-1">
        {fullName}
      </h3>
      <div className="bg-surface-container-low text-primary px-3 py-1 rounded-full font-label-sm text-xs mb-6 border border-primary-fixed">
        {cif}
      </div>
      <div className="w-full pt-4 border-t border-outline-variant flex flex-col gap-2 text-left">
        <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider">
          Relationship Manager
        </span>
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person
          </span>
          <span className="font-body-md text-sm text-on-surface font-medium">
            {rm}
          </span>
        </div>
      </div>
    </div>
  );
}
