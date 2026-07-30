import React from "react";
import PropTypes from "prop-types";

export default function PersonalProfileCard({ profile }) {
  const firstName = profile?.first_name || "Jane";
  const lastName = profile?.last_name || "Doe";
  const cif = profile?.cif || "CIF-982341";
  const relationshipManager = profile?.relationship_manager || "Not Assigned";

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2 text-on-surface">
        <span className="material-symbols-outlined text-primary">person</span>
        Personal Profile
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            First Name
          </label>
          <div className="font-body-md text-body-md text-on-surface bg-surface-container-low px-4 py-2 rounded-lg border border-transparent">
            {firstName}
          </div>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Last Name
          </label>
          <div className="font-body-md text-body-md text-on-surface bg-surface-container-low px-4 py-2 rounded-lg border border-transparent">
            {lastName}
          </div>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            CIF
          </label>
          <div className="font-body-md text-body-md text-on-surface bg-surface-container-low px-4 py-2 rounded-lg border border-transparent font-mono">
            {cif}
          </div>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Relationship Manager
          </label>
          <div className="font-body-md text-body-md text-on-surface bg-surface-container-low px-4 py-2 rounded-lg border border-transparent">
            {relationshipManager}
          </div>
        </div>
      </div>
    </div>
  );
}

PersonalProfileCard.propTypes = {
  profile: PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    cif: PropTypes.string,
    relationship_manager: PropTypes.string,
  }),
};
