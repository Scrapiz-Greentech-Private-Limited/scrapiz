import logging
from django.db import transaction
from django.utils import timezone

from vendor.models import Vendor, VendorDocument, VendorAuditLog

logger = logging.getLogger(__name__)


class VerificationService:

    @staticmethod
    @transaction.atomic
    def approve_vendor(vendor: Vendor, admin_user):
        vendor.verification_status = 'approved'
        vendor.is_active_vendor = True
        vendor.save(update_fields=['verification_status', 'is_active_vendor'])
        VendorAuditLog.log_action(
            vendor=vendor,
            action='approved',
            actor=admin_user,
        )
        return vendor

    @staticmethod
    @transaction.atomic
    def reject_vendor(vendor: Vendor, admin_user, reason: str):
        vendor.verification_status = 'rejected'
        vendor.is_active_vendor = False
        vendor.save(update_fields=['verification_status', 'is_active_vendor'])
        VendorAuditLog.log_action(
            vendor=vendor,
            action='rejected',
            actor=admin_user,
            details=reason,
        )
        return vendor

    @staticmethod
    @transaction.atomic
    def upload_document(vendor: Vendor, doc_type: str, doc_number: str, front_url: str, back_url: str = None, actor=None):
        document, created = VendorDocument.objects.update_or_create(
            vendor=vendor,
            document_type=doc_type,
            defaults={
                'document_number': doc_number,
                'document_image_front': front_url,
                'document_image_back': back_url,
                'verification_status': 'pending',
                'rejection_reason': None,
                'verified_at': None,
                'verified_by': None,
            },
        )
        VendorAuditLog.log_action(
            vendor=vendor,
            action='document_uploaded',
            actor=actor,
            new_value={'document_type': doc_type},
        )
        return document

    @staticmethod
    @transaction.atomic
    def verify_document(document: VendorDocument, admin_user):
        document.verify(admin_user)
        VendorAuditLog.log_action(
            vendor=document.vendor,
            action='document_verified',
            actor=admin_user,
            new_value={'document_type': document.document_type},
        )

    @staticmethod
    @transaction.atomic
    def reject_document(document: VendorDocument, admin_user, reason: str):
        document.reject(admin_user, reason)
        VendorAuditLog.log_action(
            vendor=document.vendor,
            action='document_rejected',
            actor=admin_user,
            details=reason,
            new_value={'document_type': document.document_type},
        )

    @staticmethod
    @transaction.atomic
    def request_document_resubmission(document: VendorDocument, admin_user, reason: str):
        document.request_resubmission(admin_user, reason)
        VendorAuditLog.log_action(
            vendor=document.vendor,
            action='document_rejected',
            actor=admin_user,
            details=f"Resubmission required: {reason}",
            new_value={'document_type': document.document_type},
        )
