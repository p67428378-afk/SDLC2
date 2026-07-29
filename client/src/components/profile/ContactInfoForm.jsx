import React, { useState, useEffect } from "react";
import profileService from "../../services/profileService";

export default function ContactInfoForm({ profile, onUpdateSuccess }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (profile) {
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
    }
  }, [profile]);

  const validateEmail = (val) => {
    if (!val) return "Email address is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return "Please enter a valid email address.";
    return "";
  };

  const validatePhone = (val) => {
    if (!val) return "Phone number is required.";
    // Strip non-digits to validate 10 digits
    const digits = val.replace(/\D/g, "");
    if (digits.length !== 10) {
      return "Phone number must be exactly 10 digits.";
    }
    return "";
  };

  const validateAddress = (val) => {
    if (!val || val.trim().length < 5) {
      return "Mailing address is required and must be at least 5 characters.";
    }
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
    setSubmitStatus({ type: "", message: "" });

    // Mark all as touched
    setTouched({ email: true, phone: true, address: true });

    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    const addressErr = validateAddress(address);

    if (emailErr || phoneErr || addressErr) {
      setErrors({ email: emailErr, phone: phoneErr, address: addressErr });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format phone to 10 digits for backend if needed, or just send stripped digits
      const formattedPhone = phone.replace(/\D/g, "");

      const payload = {
        email,
        phone: formattedPhone,
        address,
        preferences: profile.preferences,
      };

      const updatedProfile = await profileService.updateProfile(payload);
      setSubmitStatus({
        type: "success",
        message: "Profile updated successfully",
      });
      if (onUpdateSuccess) {
        onUpdateSuccess(updatedProfile);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to update profile. Please try again.";
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
        Contact Information
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="block font-label-sm text-xs text-on-surface-variant mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            className={`w-full px-4 py-2 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-1 outline-none transition-all ${
              touched.email && errors.email
                ? "border-error focus:border-error focus:ring-error"
                : "border-outline-variant focus:border-primary focus:ring-primary"
            }`}
            placeholder="e.g. jane.doe@example.com"
            disabled={isSubmitting}
          />
          {touched.email && errors.email && (
            <p className="text-error text-xs mt-1 font-body-sm">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block font-label-sm text-xs text-on-surface-variant mb-1"
          >
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={(e) => handleBlur("phone", e.target.value)}
            className={`w-full px-4 py-2 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-1 outline-none transition-all ${
              touched.phone && errors.phone
                ? "border-error focus:border-error focus:ring-error"
                : "border-outline-variant focus:border-primary focus:ring-primary"
            }`}
            placeholder="e.g. 1234567890"
            disabled={isSubmitting}
          />
          {touched.phone && errors.phone && (
            <p className="text-error text-xs mt-1 font-body-sm">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="block font-label-sm text-xs text-on-surface-variant mb-1"
          >
            Mailing Address
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={(e) => handleBlur("address", e.target.value)}
            rows="3"
            className={`w-full px-4 py-2 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-1 outline-none transition-all ${
              touched.address && errors.address
                ? "border-error focus:border-error focus:ring-error"
                : "border-outline-variant focus:border-primary focus:ring-primary"
            }`}
            placeholder="e.g. 123 Financial Way, Suite 100, New York, NY 10001"
            disabled={isSubmitting}
          />
          {touched.address && errors.address && (
            <p className="text-error text-xs mt-1 font-body-sm">
              {errors.address}
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
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
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
