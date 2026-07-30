import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function CommunicationPreferencesForm({
  profile,
  onSaveSuccess,
}) {
  const [paperless, setPaperless] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (profile?.preferences) {
      setPaperless(profile.preferences.paperless ?? true);
      setEmailNotif(profile.preferences.email_notif ?? true);
      setSmsNotif(profile.preferences.sms_notif ?? false);
      setMarketing(profile.preferences.marketing ?? false);
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const payload = {
        address: profile?.address || "",
        phone: profile?.phone || "",
        email: profile?.email || "",
        preferences: {
          paperless,
          email_notif: emailNotif,
          sms_notif: smsNotif,
          marketing,
        },
      };

      await onSaveSuccess(payload);
      setSuccessMessage("Preferences updated successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to update preferences";
      setServerError(Array.isArray(msg) ? JSON.stringify(msg) : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2 text-on-surface">
        <span className="material-symbols-outlined text-primary">campaign</span>
        Communication Preferences
      </h3>

      {successMessage && (
        <div
          className="mb-6 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg flex items-center gap-3"
          role="alert"
        >
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-label-md text-label-md">{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div
          className="mb-6 bg-error-container border border-error/20 text-on-error-container px-4 py-3 rounded-lg flex items-center gap-3"
          role="alert"
        >
          <span className="material-symbols-outlined text-error">error</span>
          <span className="font-label-md text-label-md">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={paperless}
              onChange={(e) => setPaperless(e.target.checked)}
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20"
            />
            <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
              Paperless Statements
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={(e) => setEmailNotif(e.target.checked)}
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20"
            />
            <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
              Email Notifications
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={smsNotif}
              onChange={(e) => setSmsNotif(e.target.checked)}
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20"
            />
            <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
              SMS Notifications
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20"
            />
            <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
              Marketing Communications
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={`flex items-center justify-center gap-2 w-full py-3 text-on-primary rounded-lg font-label-md text-label-md transition-colors ${
            isSaving
              ? "bg-primary/50 cursor-not-allowed"
              : "bg-primary hover:bg-surface-tint"
          }`}
        >
          {isSaving && (
            <span className="material-symbols-outlined animate-spin text-sm">
              progress_activity
            </span>
          )}
          {isSaving ? "Saving Preferences..." : "Save Preferences"}
        </button>
      </form>
    </div>
  );
}

CommunicationPreferencesForm.propTypes = {
  profile: PropTypes.shape({
    address: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    preferences: PropTypes.shape({
      paperless: PropTypes.bool,
      email_notif: PropTypes.bool,
      sms_notif: PropTypes.bool,
      marketing: PropTypes.bool,
    }),
  }),
  onSaveSuccess: PropTypes.func.isRequired,
};
