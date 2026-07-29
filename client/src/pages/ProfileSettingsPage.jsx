import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ProfileCard from "../components/profile/ProfileCard";
import PersonalInfoCard from "../components/profile/PersonalInfoCard";
import ContactInfoForm from "../components/profile/ContactInfoForm";
import PreferencesForm from "../components/profile/PreferencesForm";
import SecurityPlaceholder from "../components/profile/SecurityPlaceholder";
import profileService from "../services/profileService";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/profile/contact") {
      setActiveTab("contact");
    } else if (path === "/profile/preferences") {
      setActiveTab("preferences");
    } else if (path === "/profile/security") {
      setActiveTab("security");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    if (tab === "overview") {
      navigate("/profile");
    } else {
      navigate(`/profile/${tab}`);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError("Failed to load profile settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateSuccess = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading profile settings...</p>
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
            Error Loading Profile
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
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="font-headline-lg text-2xl font-bold text-on-background mb-1">
          Profile Settings
        </h2>
        <p className="font-body-md text-sm text-on-surface-variant">
          Manage your personal information, contact details, and communication
          preferences.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-outline-variant mb-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          <button
            onClick={() => handleTabChange("overview")}
            className={`font-label-md text-sm pb-2 px-2 transition-colors ${
              activeTab === "overview"
                ? "font-bold text-primary border-b-2 border-primary"
                : "text-secondary hover:text-on-surface-variant"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange("contact")}
            className={`font-label-md text-sm pb-2 px-2 transition-colors ${
              activeTab === "contact"
                ? "font-bold text-primary border-b-2 border-primary"
                : "text-secondary hover:text-on-surface-variant"
            }`}
          >
            Contact Information
          </button>
          <button
            onClick={() => handleTabChange("preferences")}
            className={`font-label-md text-sm pb-2 px-2 transition-colors ${
              activeTab === "preferences"
                ? "font-bold text-primary border-b-2 border-primary"
                : "text-secondary hover:text-on-surface-variant"
            }`}
          >
            Communication Preferences
          </button>
          <button
            onClick={() => handleTabChange("security")}
            className={`font-label-md text-sm pb-2 px-2 transition-colors ${
              activeTab === "security"
                ? "font-bold text-primary border-b-2 border-primary"
                : "text-secondary hover:text-on-surface-variant"
            }`}
          >
            Security Settings
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Profile Summary) */}
        <div className="lg:col-span-1">
          <ProfileCard profile={profile} />
        </div>

        {/* Right Column (Details) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeTab === "overview" && (
            <>
              {/* Personal Information */}
              <PersonalInfoCard profile={profile} />

              {/* Contact Information Overview */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline-md text-lg font-bold text-on-surface">
                    Contact Information
                  </h3>
                  <button
                    onClick={() => handleTabChange("contact")}
                    className="px-4 py-2 border border-primary text-primary font-label-md text-xs rounded-xl hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    Edit Contact Info
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-sm text-xs text-on-surface-variant mb-1">
                      Email Address
                    </label>
                    <p className="font-body-md text-sm text-on-surface font-medium">
                      {profile?.email || "test@example.com"}
                    </p>
                  </div>
                  <div>
                    <label className="block font-label-sm text-xs text-on-surface-variant mb-1">
                      Phone Number
                    </label>
                    <p className="font-body-md text-sm text-on-surface font-medium">
                      {profile?.phone || "1-800-555-0199"}
                    </p>
                  </div>
                  <div className="md:col-span-2 mt-2">
                    <label className="block font-label-sm text-xs text-on-surface-variant mb-1">
                      Mailing Address
                    </label>
                    <p className="font-body-md text-sm text-on-surface font-medium whitespace-pre-line">
                      {profile?.address ||
                        "123 Financial Way, Suite 100\nNew York, NY 10001"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Communication Preferences Overview */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline-md text-lg font-bold text-on-surface">
                    Communication Preferences
                  </h3>
                  <button
                    onClick={() => handleTabChange("preferences")}
                    className="px-4 py-2 border border-primary text-primary font-label-md text-xs rounded-xl hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    Edit Preferences
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {/* Paperless Statements */}
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant border-opacity-50 last:border-0">
                    <div>
                      <p className="font-body-md text-sm text-on-surface font-medium">
                        Paperless Statements
                      </p>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Receive account statements electronically.
                      </p>
                    </div>
                    {profile?.preferences?.paperless ? (
                      <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full font-label-sm text-xs border border-green-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          check_circle
                        </span>
                        Enabled
                      </div>
                    ) : (
                      <div className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-xs border border-outline-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          cancel
                        </span>
                        Disabled
                      </div>
                    )}
                  </div>

                  {/* Email Notifications */}
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant border-opacity-50 last:border-0">
                    <div>
                      <p className="font-body-md text-sm text-on-surface font-medium">
                        Email Notifications
                      </p>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Alerts for account activity and security.
                      </p>
                    </div>
                    {profile?.preferences?.email_notifications ? (
                      <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full font-label-sm text-xs border border-green-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          check_circle
                        </span>
                        Enabled
                      </div>
                    ) : (
                      <div className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-xs border border-outline-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          cancel
                        </span>
                        Disabled
                      </div>
                    )}
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant border-opacity-50 last:border-0">
                    <div>
                      <p className="font-body-md text-sm text-on-surface font-medium">
                        SMS Notifications
                      </p>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Receive urgent alerts via text message.
                      </p>
                    </div>
                    {profile?.preferences?.sms_notifications ? (
                      <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full font-label-sm text-xs border border-green-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          check_circle
                        </span>
                        Enabled
                      </div>
                    ) : (
                      <div className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-xs border border-outline-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          cancel
                        </span>
                        Disabled
                      </div>
                    )}
                  </div>

                  {/* Marketing Communications */}
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant border-opacity-50 last:border-0">
                    <div>
                      <p className="font-body-md text-sm text-on-surface font-medium">
                        Marketing Communications
                      </p>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        News, offers, and product updates.
                      </p>
                    </div>
                    {profile?.preferences?.marketing_opt_in ? (
                      <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full font-label-sm text-xs border border-green-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          check_circle
                        </span>
                        Enabled
                      </div>
                    ) : (
                      <div className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-xs border border-outline-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          cancel
                        </span>
                        Disabled
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "contact" && (
            <ContactInfoForm
              profile={profile}
              onUpdateSuccess={handleUpdateSuccess}
            />
          )}

          {activeTab === "preferences" && (
            <PreferencesForm
              profile={profile}
              onUpdateSuccess={handleUpdateSuccess}
            />
          )}

          {activeTab === "security" && <SecurityPlaceholder />}
        </div>
      </div>
    </AppLayout>
  );
}
