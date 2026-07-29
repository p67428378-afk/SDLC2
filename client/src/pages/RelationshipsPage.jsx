import React from "react";

const RelationshipsPage = () => {
  return (
    <div className="flex flex-col gap-md">
      <div className="card-surface rounded-xl p-lg flex flex-col gap-md">
        <div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Relationship Overview
          </h3>
          <p className="font-label-md text-label-md text-on-surface-variant mt-1">
            Visual mapping of your financial relationships across institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
          {/* Fiserv Relationship */}
          <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-[32px]">
                savings
              </span>
              <div>
                <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Fiserv
                </h4>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Core Banking & Deposits
                </p>
              </div>
            </div>
            <p className="font-body-md text-on-surface-variant">
              Fiserv acts as the primary deposit custodian, holding checking,
              savings, and certificate of deposit (CD) accounts.
            </p>
            <div className="mt-auto pt-sm border-t border-outline-variant flex justify-between text-label-md text-on-surface-variant">
              <span>CIF ID: CIF-98421</span>
              <span className="text-secondary font-bold">CONNECTED</span>
            </div>
          </div>

          {/* Cenlar Relationship */}
          <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-[32px]">
                home_work
              </span>
              <div>
                <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Cenlar
                </h4>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Mortgage Servicing
                </p>
              </div>
            </div>
            <p className="font-body-md text-on-surface-variant">
              Cenlar services the home mortgage loans, providing escrow
              management, payment tracking, and amortization schedules.
            </p>
            <div className="mt-auto pt-sm border-t border-outline-variant flex justify-between text-label-md text-on-surface-variant">
              <span>Customer ID: CUST-77210</span>
              <span className="text-secondary font-bold">CONNECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipsPage;
