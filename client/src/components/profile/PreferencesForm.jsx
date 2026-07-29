import React, { useState, useEffect } from "react";
import profileService from "../../services/profileService";

export default function PreferencesForm({ profile, onUpdateSuccess }) {
  const [paperless, setPaperless] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (profile && profile.preferences) {
      setPaperless(profile.preferences.paperless || false);
      setEmailNotifications(profile.preferences.email_notifications || false);
      setSmsNotifications(profile.preferences.sms_notifications || false);
      setMarketingOptIn(profile.preferences.marketing_opt_in || false);
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const payload = {
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        preferences: {
          paperless,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          marketing_opt_in: marketingOptIn,
        },
      };

      const updatedProfile = await profileService.updateProfile(payload);
      setSubmitStatus({
        type: "success",
        message: "Preferences updated successfully",
      });
      if (onUpdateSuccess) {
        onUpdateSuccess(updatedProfile);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to update preferences. Please try again.";
      setSubmitStatus({
        type: "error",
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h3 className="font-headline-md text-lg font-bold text-on-surface mb-4">
        Communication Preferences
      </h3>

      {submitStatus.message && (
        <div
          className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            submitStatus.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span className="material-symbols-outlined">
            {submitStatus.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-body-md text-sm">{submitStatus.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {/* Paperless Statements */}
          <div className="flex items-start gap-3 py-2 border-b border-outline-variant border-opacity-50 last:border-0">
            <input
              type="checkbox"
              id="paperless"
              checked={paperless}
              onChange={(e) => setPaperless(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 text-primary border-outline-variant rounded focus:ring-primary"
            />
            <label htmlFor="paperless" className="flex-1 cursor-pointer">
              <p className="font-body-md text-sm text-on-surface font-medium">
                Paperless Statements
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Receive account statements electronically.
              </p>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="flex items-start gap-3 py-2 border-b border-outline-variant border-opacity-50 last:border-0">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 text-primary border-outline-variant rounded focus:ring-primary"
            />
            <label
              htmlFor="emailNotifications"
              className="flex-1 cursor-pointer"
            >
              <p className="font-body-md text-sm text-on-surface font-medium">
                Email Notifications
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Alerts for account activity and security.
              </p>
            </label>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-start gap-3 py-2 border-b border-outline-variant border-opacity-50 last:border-0">
            <input
              type="checkbox"
              id="smsNotifications"
              checked={smsNotifications}
              onChange={(e) => setSmsNotifications(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 text-primary border-outline-variant rounded focus:ring-primary"
            />
            <label htmlFor="smsNotifications" className="flex-1 cursor-pointer">
              <p className="font-body-md text-sm text-on-surface font-medium">
                SMS Notifications
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Receive urgent alerts via text message.
              </p>
            </label>
          </div>

          {/* Marketing Communications */}
          <div className="flex items-start gap-3 py-2 border-b border-outline-variant border-opacity-50 last:border-0">
            <input
              type="checkbox"
              id="marketingOptIn"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 text-primary border-outline-variant rounded focus:ring-primary"
            />
            <label htmlFor="marketingOptIn" className="flex-1 cursor-pointer">
              <p className="font-body-md text-sm text-on-surface font-medium">
                Marketing Communications
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant">
                News, offers, and product updates.
              </p>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary text-on-primary font-label-md text-sm rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
