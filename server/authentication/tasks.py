import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from authentication.models import PhoneOTP

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def cleanup_expired_phone_otps_task(self):
    """Delete expired and old PhoneOTP records. Runs hourly via Celery beat."""
    try:
        cutoff = timezone.now() - timedelta(hours=24)
        deleted_count, _ = PhoneOTP.objects.filter(
            expires_at__lt=timezone.now(),
            created_at__lt=cutoff,
        ).delete()
        logger.info(f"Cleaned up {deleted_count} expired PhoneOTP records")
    except Exception as exc:
        logger.error(f"PhoneOTP cleanup failed: {exc}")
        raise self.retry(exc=exc)
