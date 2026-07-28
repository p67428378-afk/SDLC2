import React from "react";
import AppLayout from "../components/layout/AppLayout";

export default function RelationshipsPage() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { username: "John Doe" };

  return (
    <AppLayout
      title="Relationship Overview"
      subtitle="All connections across financial institutions"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        {/* Left Column: Identity Mapping */}
        <div className="lg:col-span-5 flex flex-col gap-md">
          <div className="card-surface rounded-xl p-md flex flex-col gap-md">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface border-b border-outline-variant pb-xs">
              Single Identity Mapping
            </h3>
            <p className="font-body-md text-on-surface-variant">
              Your profile is securely linked across multiple core banking and
              mortgage servicing systems using our unified customer identity
              mapping.
            </p>
            <div className="flex flex-col gap-sm mt-xs">
              <div className="flex justify-between items-center p-sm bg-surface-container-low rounded-lg border border-outline-variant">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    Unified Profile
                  </p>
                  <p className="font-body-md text-on-surface font-semibold">
                    {user.username}
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary">
                  verified_user
                </span>
              </div>

              <div className="flex justify-between items-center p-sm bg-surface-container-low rounded-lg border border-outline-variant">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    Fiserv CIF ID
                  </p>
                  <p className="font-body-md text-on-surface font-mono font-semibold">
                    CIF-98421
                  </p>
                </div>
                <span className="material-symbols-outlined text-secondary">
                  account_balance
                </span>
              </div>

              <div className="flex justify-between items-center p-sm bg-surface-container-low rounded-lg border border-outline-variant">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    Cenlar Customer ID
                  </p>
                  <p className="font-body-md text-on-surface font-mono font-semibold">
                    CEN-55102
                  </p>
                </div>
                <span className="material-symbols-outlined text-tertiary">
                  home_work
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Relationship Map */}
        <div className="lg:col-span-7 flex flex-col gap-md">
          <div className="card-surface rounded-xl p-md flex flex-col gap-md h-full min-h-[350px] justify-between">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface border-b border-outline-variant pb-xs">
              Relationship Map
            </h3>
            <div className="flex-1 flex items-center justify-center relative py-md">
              {/* Simple SVG Relationship Map */}
              <svg className="w-full max-w-md h-48" viewBox="0 0 400 200">
                {/* Lines */}
                <line
                  x1="200"
                  y1="100"
                  x2="80"
                  y2="50"
                  stroke="#8083ff"
                  strokeWidth="2"
                />
                <line
                  x1="200"
                  y1="100"
                  x2="320"
                  y2="50"
                  stroke="#8083ff"
                  strokeWidth="2"
                />
                <line
                  x1="200"
                  y1="100"
                  x2="200"
                  y2="170"
                  stroke="#8083ff"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Center Node: User */}
                <circle
                  cx="200"
                  cy="100"
                  r="30"
                  fill="#171f33"
                  stroke="#8083ff"
                  strokeWidth="3"
                />
                <text
                  x="200"
                  y="104"
                  fill="#dae2fd"
                  fontSize="10"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  YOU
                </text>

                {/* Left Node: Fiserv */}
                <circle
                  cx="80"
                  cy="50"
                  r="25"
                  fill="#171f33"
                  stroke="#4edea3"
                  strokeWidth="2"
                />
                <text
                  x="80"
                  y="54"
                  fill="#dae2fd"
                  fontSize="9"
                  textAnchor="middle"
                >
                  Fiserv
                </text>

                {/* Right Node: Cenlar */}
                <circle
                  cx="320"
                  cy="50"
                  r="25"
                  fill="#171f33"
                  stroke="#ffb95f"
                  strokeWidth="2"
                />
                <text
                  x="320"
                  y="54"
                  fill="#dae2fd"
                  fontSize="9"
                  textAnchor="middle"
                >
                  Cenlar
                </text>

                {/* Bottom Node: MFA / Auth */}
                <circle
                  cx="200"
                  cy="170"
                  r="20"
                  fill="#171f33"
                  stroke="#908fa0"
                  strokeWidth="2"
                />
                <text
                  x="200"
                  y="174"
                  fill="#dae2fd"
                  fontSize="8"
                  textAnchor="middle"
                >
                  MFA
                </text>
              </svg>
            </div>
            <div className="p-sm bg-surface-container-high/50 rounded-lg border border-outline-variant text-center">
              <p className="font-label-md text-on-surface-variant">
                All connections are encrypted and monitored in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
