import React from "react";

export default function PersonalInfoCard({ profile }) {
  const firstName = profile ? profile.first_name : "Jane";
  const lastName = profile ? profile.last_name : "Doe";
  const cif = profile ? profile.cif : "CIF-982341";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h3 className="font-headline-md text-lg font-bold text-on-surface mb-4">
        Personal Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-label-sm text-xs text-on-surface-variant mb-1">
            First Name
          </label>
          <div className="flex items-center bg-surface px-4 py-2 border border-outline-variant rounded bg-opacity-50">
            <span className="font-body-md text-sm text-on-surface flex-1">
              {firstName}
            </span>
            <span className="material-symbols-outlined text-outline text-[18px]">
              lock
            </span>
          </div>
        </div>
        <div>
          <label className="block font-label-sm text-xs text-on-surface-variant mb-1">
            Last Name
          </label>
          <div className="flex items-center bg-surface px-4 py-2 border border-outline-variant rounded bg-opacity-50">
            <span className="font-body-md text-sm text-on-surface flex-1">
              {lastName}
            </span>
            <span className="material-symbols-outlined text-outline text-[18px]">
              lock
            </span>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-xs text-on-surface-variant mb-1">
            CIF Number
          </label>
          <div className="flex items-center bg-surface px-4 py-2 border border-outline-variant rounded bg-opacity-50">
            <span className="font-body-md text-sm text-on-surface flex-1">
              {cif}
            </span>
            <span className="material-symbols-outlined text-outline text-[18px]">
              lock
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
