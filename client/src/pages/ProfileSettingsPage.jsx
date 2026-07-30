import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import PersonalProfileCard from "../components/profile/PersonalProfileCard";
import ContactInfoForm from "../components/profile/ContactInfoForm";
import CommunicationPreferencesForm from "../components/profile/CommunicationPreferencesForm";
import SecuritySettingsPlaceholder from "../components/profile/SecuritySettingsPlaceholder";
import { profileService } from "../services/profileService";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // overview, contact, preferences, security
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      try {
        const historyData = await profileService.getProfileHistory();
        setHistory(historyData);
      } catch (hErr) {
        // History is optional, don't block the main profile load
        console.warn("Failed to fetch profile history", hErr);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load profile data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSaveProfile = async (payload) => {
    const updatedProfile = await profileService.updateProfile(payload);
    setProfile(updatedProfile);
    // Refresh history
    try {
      const historyData = await profileService.getProfileHistory();
      setHistory(historyData);
    } catch (hErr) {
      console.warn("Failed to refresh profile history", hErr);
    }
    return updatedProfile;
  };

  if (isLoading) {
    return (
      <AppLayout userProfile={profile}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">
              progress_activity
            </span>
            <p className="text-text-secondary font-body-md">
              Loading profile settings...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout userProfile={profile}>
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-xl flex flex-col gap-4 max-w-2xl mx-auto mt-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-2xl">
              error
            </span>
            <h3 className="font-headline-md text-headline-md">
              Error Loading Profile
            </h3>
          </div>
          <p className="font-body-md">{error}</p>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-red-700 transition-colors self-start"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userProfile={profile}>
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h2 className="font-headline-lg text-headline-lg text-text-primary">
            Profile Settings
          </h2>
          <p className="font-body-lg text-body-lg text-text-secondary mt-2">
            Manage your personal information and communication preferences.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-8 gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 font-label-md text-label-md whitespace-nowrap transition-colors ${
              activeTab === "overview"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-primary"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`pb-4 font-label-md text-label-md whitespace-nowrap transition-colors ${
              activeTab === "contact"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-primary"
            }`}
          >
            Contact Information
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-4 font-label-md text-label-md whitespace-nowrap transition-colors ${
              activeTab === "preferences"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-primary"
            }`}
          >
            Communication Preferences
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`pb-4 font-label-md text-label-md whitespace-nowrap transition-colors ${
              activeTab === "security"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-primary"
            }`}
          >
            Security Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Left Column: Personal Profile */}
            <div className="lg:col-span-4 space-y-6">
              <PersonalProfileCard profile={profile} />
            </div>

            {/* Right Column: Contact & Preferences Summary */}
            <div className="lg:col-span-8 space-y-6">
              {/* Contact Info Summary */}
              <div className="bg-card-background rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline-md text-headline-md flex items-center gap-2 text-text-primary">
                    <span className="material-symbols-outlined text-primary">
                      contact_mail
                    </span>
                    Contact Information
                  </h3>
                  <button
                    onClick={() => setActiveTab("contact")}
                    className="text-accent font-label-md hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <span className="block font-label-sm text-label-sm text-text-secondary mb-1">
                      Mailing Address
                    </span>
                    <p className="font-body-md text-body-md text-text-primary bg-page-background px-4 py-3 rounded-lg border border-transparent whitespace-pre-line">
                      {profile?.address || "No address provided"}
                    </p>
                  </div>
                  <div>
                    <span className="block font-label-sm text-label-sm text-text-secondary mb-1">
                      Phone Number
                    </span>
                    <p className="font-body-md text-body-md text-text-primary bg-page-background px-4 py-2 rounded-lg border border-transparent">
                      {profile?.phone || "No phone number provided"}
                    </p>
                  </div>
                  <div>
                    <span className="block font-label-sm text-label-sm text-text-secondary mb-1">
                      Email Address
                    </span>
                    <p className="font-body-md text-body-md text-text-primary bg-page-background px-4 py-2 rounded-lg border border-transparent">
                      {profile?.email || "No email address provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferences Summary */}
              <div className="bg-card-background rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline-md text-headline-md flex items-center gap-2 text-text-primary">
                    <span className="material-symbols-outlined text-primary">
                      campaign
                    </span>
                    Communication Preferences
                  </h3>
                  <button
                    onClick={() => setActiveTab("preferences")}
                    className="text-accent font-label-md hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-page-background rounded-lg">
                    <span
                      className={`material-symbols-outlined ${profile?.preferences?.paperless ? "text-primary" : "text-text-secondary"}`}
                    >
                      {profile?.preferences?.paperless
                        ? "check_circle"
                        : "cancel"}
                    </span>
                    <span className="font-body-md text-body-md text-text-primary">
                      Paperless Statements
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-page-background rounded-lg">
                    <span
                      className={`material-symbols-outlined ${profile?.preferences?.email_notif ? "text-primary" : "text-text-secondary"}`}
                    >
                      {profile?.preferences?.email_notif
                        ? "check_circle"
                        : "cancel"}
                    </span>
                    <span className="font-body-md text-body-md text-text-primary">
                      Email Notifications
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-page-background rounded-lg">
                    <span
                      className={`material-symbols-outlined ${profile?.preferences?.sms_notif ? "text-primary" : "text-text-secondary"}`}
                    >
                      {profile?.preferences?.sms_notif
                        ? "check_circle"
                        : "cancel"}
                    </span>
                    <span className="font-body-md text-body-md text-text-primary">
                      SMS Notifications
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-page-background rounded-lg">
                    <span
                      className={`material-symbols-outlined ${profile?.preferences?.marketing ? "text-primary" : "text-text-secondary"}`}
                    >
                      {profile?.preferences?.marketing
                        ? "check_circle"
                        : "cancel"}
                    </span>
                    <span className="font-body-md text-body-md text-text-primary">
                      Marketing Communications
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Change History */}
              {history && history.length > 0 && (
                <div className="bg-card-background rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2 text-text-primary">
                    <span className="material-symbols-outlined text-primary">
                      history
                    </span>
                    Recent Profile Changes
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-label-sm text-text-secondary">
                          <th className="pb-3 font-semibold">Date & Time</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-body-sm text-body-sm text-text-primary">
                        {history.slice(0, 5).map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-page-background transition-colors"
                          >
                            <td className="py-3 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full font-label-sm text-xs ${
                                  log.status === "SUCCESS"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-error/10 text-error"
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3">
                              {log.status === "SUCCESS" ? (
                                <span className="text-text-secondary">
                                  Updated:{" "}
                                  {Object.keys(
                                    log.changed_fields_after || {},
                                  ).join(", ")}
                                </span>
                              ) : (
                                <span className="text-error font-medium">
                                  {log.failure_reason || "Sync failed"}
                                  {log.compensation_applied && " (Rolled back)"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <ContactInfoForm
              profile={profile}
              onSaveSuccess={handleSaveProfile}
            />
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <CommunicationPreferencesForm
              profile={profile}
              onSaveSuccess={handleSaveProfile}
            />
          </div>
        )}

        {activeTab === "security" && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <SecuritySettingsPlaceholder />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
