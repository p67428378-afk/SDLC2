import re
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models import User, ProfileChangeLog
from server.services.fiserv import FiservMockService
from server.services.cenlar import CenlarMockService


class ProfileSyncService:
    def __init__(
        self, fiserv_service: FiservMockService, cenlar_service: CenlarMockService
    ):
        self.fiserv_service = fiserv_service
        self.cenlar_service = cenlar_service

    def validate_profile_data(self, address: str, phone: str, email: str):
        errors = {}
        if not address or len(address.strip()) < 5:
            errors["address"] = "Address must be at least 5 characters long"

        # Phone validation: strip non-digits, must be 10 digits
        digits = re.sub(r"\D", "", phone) if phone else ""
        if not phone or len(digits) != 10:
            errors["phone"] = "Phone number must be a valid 10-digit US format"

        # Email validation
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not email or not re.match(email_regex, email):
            errors["email"] = "Invalid email format"

        if errors:
            raise HTTPException(status_code=400, detail=errors)

    def sync_profile(
        self,
        db: Session,
        user: User,
        address: str,
        phone: str,
        email: str,
        preferences: Dict[str, Any],
    ) -> Dict[str, Any]:
        # 1. Validate
        self.validate_profile_data(address, phone, email)

        if not user.fiserv_cif:
            raise HTTPException(
                status_code=400, detail="User has no core banking profile"
            )
        if not user.cenlar_customer_id:
            raise HTTPException(status_code=400, detail="User has no mortgage profile")

        fiserv_cif = str(user.fiserv_cif)
        cenlar_customer_id = str(user.cenlar_customer_id)

        # 2. Update Fiserv
        fiserv_profile_res = self.fiserv_service.update_customer_profile(
            fiserv_cif, {"address": address, "phone": phone, "email": email}
        )
        fiserv_pref_res = self.fiserv_service.update_communication_preferences(
            fiserv_cif, preferences
        )

        prev_fiserv_profile = fiserv_profile_res.get("previous_state") or {}
        prev_fiserv_pref = fiserv_pref_res.get("previous_state") or {}

        fiserv_profile_live = fiserv_profile_res.get("live_sync_available", True)
        fiserv_pref_live = fiserv_pref_res.get("live_sync_available", True)

        # live_sync_available tracks the customer-visible profile fields (address, phone,
        # email), which are what the Party service actually accepts. Communication
        # preferences ride on the ePreference service, which the cert sandbox rejects for
        # updates, so a preference fallback is reported as a partial sync instead of
        # dragging a genuinely successful profile write down to FALLBACK_SIMULATED.
        live_sync_available = bool(fiserv_profile_live)

        fallback_reason = None
        if not live_sync_available:
            fallback_reason = (
                fiserv_profile_res.get("fallback_reason") or "ENTITLEMENT_DENIED"
            )

        partial_fiserv_sync = list(fiserv_pref_res.get("partial_fiserv_sync") or [])
        if not fiserv_pref_live:
            partial_fiserv_sync.append("preferences")
        partial_fiserv_sync = partial_fiserv_sync or None

        # 3. Sync to Cenlar
        cenlar_profile_res = None
        cenlar_pref_res = None
        cenlar_success = False
        failure_reason = None

        try:
            cenlar_profile_res = self.cenlar_service.update_borrower_profile(
                cenlar_customer_id,
                {"address": address, "phone": phone, "email": email},
            )
            # Cenlar correspondence preferences only support paperless, email_notif, marketing
            cenlar_prefs = {
                "paperless": preferences.get("paperless", True),
                "email_notif": preferences.get("email_notif", True),
                "marketing": preferences.get("marketing", True),
            }
            cenlar_pref_res = self.cenlar_service.update_correspondence_preferences(
                cenlar_customer_id, cenlar_prefs
            )
            cenlar_success = True
        except Exception as e:
            failure_reason = str(e)

        if not cenlar_success:
            # Compensate: rollback Fiserv
            self.fiserv_service.update_customer_profile(fiserv_cif, prev_fiserv_profile)
            self.fiserv_service.update_communication_preferences(
                fiserv_cif, prev_fiserv_pref
            )

            # Log failed attempt
            changed_fields_before = {
                "address": prev_fiserv_profile.get("address"),
                "phone": prev_fiserv_profile.get("phone"),
                "email": prev_fiserv_profile.get("email"),
                "preferences": prev_fiserv_pref,
            }
            changed_fields_after = {
                "address": address,
                "phone": phone,
                "email": email,
                "preferences": preferences,
            }
            log = ProfileChangeLog(
                user_id=user.id,
                changed_fields_before=changed_fields_before,
                changed_fields_after=changed_fields_after,
                status="FAILED",
                live_sync_available=live_sync_available,
                failure_reason=failure_reason
                or fallback_reason
                or "Cenlar sync failed",
                compensation_applied=True,
                compensation_details={
                    "fiserv_profile_reverted": True,
                    "fiserv_preferences_reverted": True,
                },
            )
            db.add(log)
            try:
                db.commit()
            except Exception:
                db.rollback()

            raise HTTPException(
                status_code=422,
                detail="Failed to sync profile with Cenlar; changes have been rolled back.",
            )

        prev_cenlar_profile = (cenlar_profile_res or {}).get("previous_state") or {}
        prev_cenlar_pref = (cenlar_pref_res or {}).get("previous_state") or {}

        # 4. Persist Audit Record
        changed_fields_before = {
            "address": prev_fiserv_profile.get("address"),
            "phone": prev_fiserv_profile.get("phone"),
            "email": prev_fiserv_profile.get("email"),
            "preferences": prev_fiserv_pref,
        }
        changed_fields_after = {
            "address": address,
            "phone": phone,
            "email": email,
            "preferences": preferences,
        }

        status_value = "SUCCESS" if live_sync_available else "FALLBACK_SIMULATED"

        comp_details = None
        if partial_fiserv_sync and live_sync_available:
            comp_details = {"partial_fiserv_sync": partial_fiserv_sync}

        log = ProfileChangeLog(
            user_id=user.id,
            changed_fields_before=changed_fields_before,
            changed_fields_after=changed_fields_after,
            status=status_value,
            live_sync_available=live_sync_available,
            failure_reason=fallback_reason,
            compensation_applied=False,
            compensation_details=comp_details,
        )
        db.add(log)

        try:
            db.commit()
            db.refresh(log)
        except Exception as e:
            db.rollback()
            # Compensate: rollback both Cenlar and Fiserv
            self.cenlar_service.update_borrower_profile(
                cenlar_customer_id, prev_cenlar_profile
            )
            self.cenlar_service.update_correspondence_preferences(
                cenlar_customer_id, prev_cenlar_pref
            )
            self.fiserv_service.update_customer_profile(fiserv_cif, prev_fiserv_profile)
            self.fiserv_service.update_communication_preferences(
                fiserv_cif, prev_fiserv_pref
            )

            raise HTTPException(
                status_code=500,
                detail=f"A critical error occurred while saving the audit record; all profile changes have been rolled back. Error: {str(e)}",
            )

        # Return updated profile with sync metadata
        updated_profile = self.fiserv_service.get_customer_profile(fiserv_cif) or {}
        updated_profile["status"] = "success"
        updated_profile["message"] = (
            "Profile updated successfully."
            if live_sync_available
            else "Profile saved. Core banking sync is pending and will be retried."
        )

        metadata = {
            "fiserv_sync": "LIVE_SUCCESS"
            if live_sync_available
            else "FALLBACK_SIMULATED",
            "cenlar_sync": "SIMULATED",
            "live_sync_available": live_sync_available,
            "fallback_reason": fallback_reason,
        }
        if partial_fiserv_sync and live_sync_available:
            metadata["partial_fiserv_sync"] = partial_fiserv_sync

        updated_profile["metadata"] = metadata
        return updated_profile
