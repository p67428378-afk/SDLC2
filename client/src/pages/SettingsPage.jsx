import React, { useEffect, useState } from "react";
import DarkModeToggle from "../components/dashboard/DarkModeToggle";
import { getUserProfile } from "../services/api";
import { User, Mail, Shield, Settings, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  return (
    <main className="flex-1 mt-16 p-margin-mobile md:p-margin-desktop space-y-gutter">
      <div className="max-w-3xl mx-auto space-y-gutter">
        {/* Page Header */}
        <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Settings
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Manage your account preferences and theme settings
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 bg-error-container/20 border border-error rounded-xl text-error font-body-md">
            {error}
          </div>
        ) : (
          <div className="space-y-gutter">
            {/* Profile Section */}
            <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md space-y-4">
              <h2 className="font-headline-md text-headline-md font-semibold text-on-surface flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                User Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
                  <Mail className="w-5 h-5 text-on-surface-variant" />
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Email Address
                    </p>
                    <p className="font-body-md text-body-md text-on-surface font-medium">
                      {profile?.email || "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
                  <Shield className="w-5 h-5 text-on-surface-variant" />
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Account ID
                    </p>
                    <p className="font-body-md text-body-md text-on-surface font-medium truncate">
                      {profile?.id || "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                <p className="font-label-sm text-label-sm text-primary">
                  Test Account: user@example.com / testpassword
                </p>
              </div>
            </section>

            {/* Preferences Section */}
            <section className="space-y-4">
              <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
                Preferences
              </h2>
              <DarkModeToggle />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
