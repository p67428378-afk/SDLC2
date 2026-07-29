import re
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

    def sync_profile(
        self,
        db: Session,
        user: User,
        address: str,
        phone: str,
        email: str,
        preferences: dict,
    ) -> dict:
        # 1. Server-side validation
        errors = {}
        if not address or len(address.strip()) < 5:
            errors["address"] = (
                "Address is required and must be at least 5 characters long"
            )

        if not email:
            errors["email"] = "Email is required"
        else:
            email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
            if not re.match(email_regex, email):
                errors["email"] = "Invalid email format"

        if not phone:
            errors["phone"] = "Phone number is required"
        else:
            # Strip non-digits
            digits = "".join(c for c in phone if c.isdigit())
            if len(digits) != 10:
                errors["phone"] = "Phone number must be a valid 10-digit US number"

        if errors:
            raise HTTPException(status_code=400, detail=errors)

        # 2. Fetch previous states for compensation
        if not user.fiserv_cif:
            raise HTTPException(
                status_code=400, detail="User has no core banking profile"
            )

        fiserv_profile = self.fiserv_service.get_customer_profile(user.fiserv_cif)
        if not fiserv_profile:
            raise HTTPException(status_code=404, detail="Fiserv profile not found")

        prev_fiserv_address = fiserv_profile.get("address")
        prev_fiserv_phone = fiserv_profile.get("phone")
        prev_fiserv_email = fiserv_profile.get("email")
        prev_fiserv_prefs = fiserv_profile.get("preferences", {}).copy()

        if not user.cenlar_customer_id:
            raise HTTPException(status_code=400, detail="User has no mortgage profile")

        cenlar_profile = self.cenlar_service.get_borrower_profile(
            user.cenlar_customer_id
        )
        prev_cenlar_address = None
        prev_cenlar_phone = None
        prev_cenlar_email = None
        prev_cenlar_prefs = {}
        if cenlar_profile:
            prev_cenlar_address = cenlar_profile.get("address")
            prev_cenlar_phone = cenlar_profile.get("phone")
            prev_cenlar_email = cenlar_profile.get("email")
            prev_cenlar_prefs = cenlar_profile.get("preferences", {}).copy()

        # Calculate changed fields for audit log
        changed_fields = {}
        if prev_fiserv_address != address:
            changed_fields["address"] = {"old": prev_fiserv_address, "new": address}
        if prev_fiserv_phone != phone:
            changed_fields["phone"] = {"old": prev_fiserv_phone, "new": phone}
        if prev_fiserv_email != email:
            changed_fields["email"] = {"old": prev_fiserv_email, "new": email}

        # Check preferences changes
        pref_changes = {}
        for k, v in preferences.items():
            old_v = prev_fiserv_prefs.get(k)
            if old_v != v:
                pref_changes[k] = {"old": old_v, "new": v}
        if pref_changes:
            changed_fields["preferences"] = pref_changes

        # 3. Update Fiserv
        fiserv_profile_ok = self.fiserv_service.update_customer_profile(
            user.fiserv_cif, address, phone, email
        )
        fiserv_prefs_ok = self.fiserv_service.update_communication_preferences(
            user.fiserv_cif, preferences
        )

        if not (fiserv_profile_ok and fiserv_prefs_ok):
            raise HTTPException(
                status_code=500, detail="Failed to update Fiserv profile"
            )

        # 4. Sync to Cenlar
        cenlar_ok = False
        try:
            cenlar_profile_ok = self.cenlar_service.update_borrower_profile(
                user.cenlar_customer_id, address, phone, email
            )
            cenlar_prefs_ok = self.cenlar_service.update_correspondence_preferences(
                user.cenlar_customer_id, preferences
            )
            cenlar_ok = cenlar_profile_ok and cenlar_prefs_ok
        except Exception:
            pass

        if not cenlar_ok:
            # Compensate: rollback Fiserv
            self.fiserv_service.update_customer_profile(
                user.fiserv_cif,
                prev_fiserv_address,
                prev_fiserv_phone,
                prev_fiserv_email,
            )
            self.fiserv_service.update_communication_preferences(
                user.fiserv_cif, prev_fiserv_prefs
            )

            # Log failed sync to DB
            log_entry = ProfileChangeLog(
                user_id=user.id,
                changed_fields=changed_fields,
                status="FAILED_CENLAR_SYNC",
            )
            db.add(log_entry)
            try:
                db.commit()
            except Exception:
                db.rollback()

            raise HTTPException(
                status_code=500,
                detail="Failed to sync profile to Cenlar. Fiserv changes rolled back.",
            )

        # 5. Persist Audit Log
        log_entry = ProfileChangeLog(
            user_id=user.id, changed_fields=changed_fields, status="COMPLETED"
        )
        db.add(log_entry)

        try:
            db.commit()
            db.refresh(log_entry)
        except Exception as e:
            db.rollback()
            # Compensate: rollback both Cenlar and Fiserv
            self.fiserv_service.update_customer_profile(
                user.fiserv_cif,
                prev_fiserv_address,
                prev_fiserv_phone,
                prev_fiserv_email,
            )
            self.fiserv_service.update_communication_preferences(
                user.fiserv_cif, prev_fiserv_prefs
            )
            if cenlar_profile:
                self.cenlar_service.update_borrower_profile(
                    user.cenlar_customer_id,
                    prev_cenlar_address,
                    prev_cenlar_phone,
                    prev_cenlar_email,
                )
                self.cenlar_service.update_correspondence_preferences(
                    user.cenlar_customer_id, prev_cenlar_prefs
                )

            raise HTTPException(
                status_code=500,
                detail=f"Database persistence failed: {str(e)}. All changes rolled back.",
            )

        # Return updated profile
        updated_profile = self.fiserv_service.get_customer_profile(user.fiserv_cif)
        return updated_profile
