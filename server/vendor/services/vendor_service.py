import logging
from django.db import transaction

from vendor.models import Vendor, VendorAuditLog

logger = logging.getLogger(__name__)


class VendorService:

    @staticmethod
    @transaction.atomic
    def create_vendor(user, data: dict) -> Vendor:
        aadhaar_number = data.pop('aadhaar_number', '')
        vendor = Vendor.objects.create(
            user=user,
            aadhaar_hash=Vendor.hash_aadhaar(aadhaar_number) if aadhaar_number else '',
            **data,
        )
        user.is_vendor = True
        user.save(update_fields=['is_vendor'])
        VendorAuditLog.log_action(vendor=vendor, action='created', actor=user)
        return vendor

    @staticmethod
    def get_vendor_profile(user):
        try:
            return Vendor.objects.select_related('user', 'biometric').prefetch_related('documents').get(user=user)
        except Vendor.DoesNotExist:
            return None

    @staticmethod
    @transaction.atomic
    def update_vendor_profile(vendor: Vendor, data: dict, actor=None) -> Vendor:
        previous = {}
        updated = {}
        for field, value in data.items():
            if hasattr(vendor, field):
                previous[field] = getattr(vendor, field)
                setattr(vendor, field, value)
                updated[field] = value
        vendor.save()
        if updated:
            VendorAuditLog.log_action(
                vendor=vendor,
                action='updated',
                actor=actor,
                previous_value=previous,
                new_value=updated,
            )
        return vendor

    @staticmethod
    @transaction.atomic
    def submit_for_verification(vendor: Vendor, actor=None):
        if not vendor.documents.exists():
            raise ValueError("At least one document must be uploaded before submitting for verification")
        vendor.verification_status = 'pending'
        vendor.save(update_fields=['verification_status'])
        VendorAuditLog.log_action(
            vendor=vendor,
            action='verification_submitted',
            actor=actor,
        )
        return vendor
