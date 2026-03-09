import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_face_embedding_task(self, vendor_id: int, image_url: str):
    """Generate and store a face embedding for a vendor's profile image."""
    try:
        from vendor.models import Vendor
        from vendor.services.biometric_service import BiometricService

        vendor = Vendor.objects.get(id=vendor_id)
        embedding = BiometricService.generate_embedding(image_url)
        if embedding is None:
            logger.warning(f"No face detected for vendor {vendor_id} from {image_url}")
            return

        BiometricService.store_embedding(vendor, embedding)
        logger.info(f"Face embedding stored for vendor {vendor_id}")
    except Exception as exc:
        logger.error(f"Face embedding generation failed for vendor {vendor_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def compare_face_embedding_task(self, vendor_id: int, selfie_url: str, verification_id: int):
    """Compare selfie embedding with stored vendor embedding and update the ArrivalVerification."""
    try:
        from vendor.models import ArrivalVerification, Vendor, VendorAuditLog, VendorBiometric
        from vendor.services.biometric_service import BiometricService, SIMILARITY_THRESHOLD

        vendor = Vendor.objects.get(id=vendor_id)
        verification = ArrivalVerification.objects.get(id=verification_id)

        selfie_embedding = BiometricService.generate_embedding(selfie_url)
        if selfie_embedding is None:
            verification.flag_for_manual_review = True
            verification.save(update_fields=['flag_for_manual_review'])
            VendorAuditLog.log_action(vendor=vendor, action='face_flagged', details='No face detected in selfie')
            return

        try:
            stored = vendor.biometric
        except VendorBiometric.DoesNotExist:
            verification.flag_for_manual_review = True
            verification.save(update_fields=['flag_for_manual_review'])
            VendorAuditLog.log_action(vendor=vendor, action='face_flagged', details='No stored biometric found')
            return

        score = BiometricService.compare_embeddings(selfie_embedding, stored.embedding_vector)
        is_verified = score >= SIMILARITY_THRESHOLD

        verification.similarity_score = score
        verification.is_verified = is_verified
        verification.flag_for_manual_review = not is_verified
        verification.save(update_fields=['similarity_score', 'is_verified', 'flag_for_manual_review'])

        action = 'face_verified' if is_verified else 'face_flagged'
        VendorAuditLog.log_action(vendor=vendor, action=action, new_value={'score': score})
        logger.info(f"Arrival verification {verification_id} for vendor {vendor_id}: score={score:.4f}, verified={is_verified}")

    except Exception as exc:
        logger.error(f"Face comparison failed for vendor {vendor_id}: {exc}")
        raise self.retry(exc=exc)
