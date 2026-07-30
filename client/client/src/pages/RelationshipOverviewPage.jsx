import React, { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { dashboardService } from "../services/api";

export default function RelationshipOverviewPage() {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prof, summ] = await Promise.all([
          dashboardService.getProfile(),
          dashboardService.getSummary(),
        ]);
        setProfile(prof);
        setSummary(summ);
      } catch (err) {
        setError("Failed to load relationship overview. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">
            Loading relationship overview...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 border border-outline-variant rounded-xl shadow-sm text-center">
          <span className="material-symbols-outlined text-error text-5xl">
            error
          </span>
          <h2 className="mt-4 text-xl font-bold text-on-surface">
            Error Loading Overview
          </h2>
          <p className="mt-2 text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-primary text-on-primary font-label-md py-2 px-4 rounded-xl hover:bg-primary-container transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout userProfile={profile}>
      <div>
        <h1 className="font-headline-lg text-on-surface">
          Relationship Overview
        </h1>
        <p className="font-body-md text-secondary mt-1">
          A comprehensive view of your entire relationship with ApexUnion Bank.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Profile Card */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <h2 className="font-headline-sm text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              person
            </span>
            Customer Profile
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-outline-variant pb-2">
              <span className="text-secondary font-medium">Full Name</span>
              <span className="text-on-surface font-semibold">
                {profile.first_name} {profile.last_name}
              </span>
            </div>
            <div className="flex justify-between border-b border-outline-variant pb-2">
              <span className="text-secondary font-medium">CIF Number</span>
              <span className="text-on-surface font-mono font-semibold">
                {profile.cif}
              </span>
            </div>
            <div className="flex justify-between border-b border-outline-variant pb-2">
              <span className="text-secondary font-medium">Email Address</span>
              <span className="text-on-surface font-semibold">
                {profile.email}
              </span>
            </div>
            <div className="flex justify-between border-b border-outline-variant pb-2">
              <span className="text-secondary font-medium">Phone Number</span>
              <span className="text-on-surface font-semibold">
                {profile.phone}
              </span>
            </div>
            <div className="flex justify-between border-b border-outline-variant pb-2">
              <span className="text-secondary font-medium">
                Mailing Address
              </span>
              <span className="text-on-surface font-semibold text-right max-w-[200px]">
                {profile.address}
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-secondary font-medium">
                Relationship Manager
              </span>
              <span className="text-primary font-semibold">
                {profile.relationship_manager}
              </span>
            </div>
          </div>
        </div>

        {/* Relationship Summary Card */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                analytics
              </span>
              Financial Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface p-4 rounded-xl border border-outline-variant">
                <span className="text-xs text-secondary font-medium block mb-1">
                  Total Deposits
                </span>
                <span className="text-lg font-bold text-on-surface">
                  $
                  {summary.total_deposits.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-outline-variant">
                <span className="text-xs text-secondary font-medium block mb-1">
                  Total Loans
                </span>
                <span className="text-lg font-bold text-error">
                  $
                  {summary.total_loans.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-outline-variant">
                <span className="text-xs text-secondary font-medium block mb-1">
                  Total Mortgages
                </span>
                <span className="text-lg font-bold text-error">
                  $
                  {summary.total_mortgages.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary-fixed text-on-primary-fixed p-6 rounded-xl border border-primary-fixed-dim flex justify-between items-center">
            <div>
              <span className="text-sm font-medium uppercase tracking-wider block mb-1">
                Net Worth
              </span>
              <span className="text-3xl font-extrabold">
                $
                {summary.net_worth.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="material-symbols-outlined text-4xl">
              {summary.net_worth >= 0 ? "trending_up" : "trending_down"}
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
