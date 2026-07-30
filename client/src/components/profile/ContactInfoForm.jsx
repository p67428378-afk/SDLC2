import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function ContactInfoForm({ profile, onSaveSuccess }) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setAddress(profile.address || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const validateEmail = (val) => {
    if (!val) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return "Invalid email format";
    return "";
  };

  const validatePhone = (val) => {
    if (!val) return "Phone number is required";
    // Strip non-digits to check if we have exactly 10 digits
    const digits = val.replace(/\D/g, "");
    if (digits.length !== 10) return "Phone number must be exactly 10 digits";
    return "";
  };

  const validateAddress = (val) => {
    if (!val) return "Mailing address is required";
    if (val.trim().length < 5) return "Address is too short";
    return "";
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let err = "";
    if (field === "email") err = validateEmail(value);
    if (field === "phone") err = validatePhone(value);
    if (field === "address") err = validateAddress(value);

    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    const addressErr = validateAddress(address);

    if (emailErr || phoneErr || addressErr) {
      setErrors({
        email: emailErr,
        phone: phoneErr,
        address: addressErr,
      });
      setTouched({
        email: true,
        phone: true,
        address: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        address,
        phone,
        email,
        preferences: profile?.preferences || {
          email_notif: true,
          marketing: false,
          paperless: true,
          sms_notif: false,
        },
      };

      await onSaveSuccess(payload);
      setSuccessMessage("Profile updated successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to update profile";
      setServerError(Array.isArray(msg) ? JSON.stringify(msg) : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormInvalid = !!(
    validateEmail(email) ||
    validatePhone(phone) ||
    validateAddress(address)
  );

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2 text-on-surface">
        <span className="material-symbols-outlined text-primary">
          contact_mail
        </span>
        Contact Information
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
        {/* Mailing Address */}
        <div>
          <label
            className="block font-label-sm text-label-sm text-on-surface-variant mb-1"
            htmlFor="address"
          >
            Mailing Address
          </label>
          <textarea
            id="address"
            className={`w-full bg-surface-container-lowest border rounded-lg p-3 font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none h-24 ${
              touched.address && errors.address
                ? "border-error"
                : "border-outline-variant"
            }`}
            rows="3"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={(e) => handleBlur("address", e.target.value)}
            placeholder="Enter your full mailing address"
          />
          {touched.address && errors.address && (
            <p className="text-error text-xs mt-1 font-label-sm" role="alert">
              {errors.address}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label
            className="block font-label-sm text-label-sm text-on-surface-variant mb-1"
            htmlFor="phone"
          >
            Phone Number
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              className={`w-full bg-surface-container-lowest border rounded-lg pl-3 pr-10 py-2 font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                touched.phone && errors.phone
                  ? "border-error"
                  : "border-outline-variant"
              }`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={(e) => handleBlur("phone", e.target.value)}
              placeholder="e.g. 123-456-7890"
            />
            {touched.phone && !errors.phone && phone && (
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-sm">
                check_circle
              </span>
            )}
          </div>
          {touched.phone && errors.phone && (
            <p className="text-error text-xs mt-1 font-label-sm" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label
            className="block font-label-sm text-label-sm text-on-surface-variant mb-1"
            htmlFor="email"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              className={`w-full bg-surface-container-lowest border rounded-lg pl-3 pr-10 py-2 font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                touched.email && errors.email
                  ? "border-error"
                  : "border-outline-variant"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              placeholder="e.g. jane@example.com"
            />
            {touched.email && !errors.email && email && (
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-sm">
                check_circle
              </span>
            )}
          </div>
          {touched.email && errors.email && (
            <p className="text-error text-xs mt-1 font-label-sm" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isFormInvalid}
            className={`px-6 py-2.5 rounded-lg font-label-md text-label-md text-on-primary transition-colors whitespace-nowrap flex items-center gap-2 ${
              isSaving || isFormInvalid
                ? "bg-primary/50 cursor-not-allowed"
                : "bg-primary hover:bg-surface-tint"
            }`}
          >
            {isSaving && (
              <span className="material-symbols-outlined animate-spin text-sm">
                progress_activity
              </span>
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

ContactInfoForm.propTypes = {
  profile: PropTypes.shape({
    address: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    preferences: PropTypes.object,
  }),
  onSaveSuccess: PropTypes.func.isRequired,
};
