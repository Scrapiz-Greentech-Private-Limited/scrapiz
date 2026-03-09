import hashlib
import secrets
import logging
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone

from authentication.models import PhoneOTP

logger = logging.getLogger(__name__)

MAX_VERIFY_ATTEMPTS = 5
OTP_EXPIRY_MINUTES = 10
COOLDOWN_SECONDS = 120  # 2 minutes
MAX_DAILY_OTPS = 3


def generate_otp() -> str:
    return str(secrets.SystemRandom().randint(100000, 999999))


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def check_phone_rate_limit(phone: str) -> dict:
    """Check per-phone rate limits. Returns {"allowed": bool, "reason": str|None}."""
    cooldown_key = f"otp_cooldown:{phone}"
    if cache.get(cooldown_key):
        return {"allowed": False, "reason": "Please wait 2 minutes before requesting another OTP"}

    daily_key = f"otp_daily:{phone}"
    daily_count = cache.get(daily_key, 0)
    if daily_count >= MAX_DAILY_OTPS:
        return {"allowed": False, "reason": "Maximum OTP limit reached for today. Try again tomorrow"}

    return {"allowed": True, "reason": None}


def create_phone_otp(phone: str) -> str:
    """Create a new PhoneOTP record and return the plaintext OTP."""
    otp = generate_otp()
    PhoneOTP.objects.create(
        phone_number=phone,
        otp_hash=hash_otp(otp),
        expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )

    # Set cooldown (3 min)
    cooldown_key = f"otp_cooldown:{phone}"
    cache.set(cooldown_key, True, COOLDOWN_SECONDS)

    # Increment daily counter
    daily_key = f"otp_daily:{phone}"
    daily_count = cache.get(daily_key, 0)
    # TTL until end of day
    now = timezone.now()
    end_of_day = now.replace(hour=23, minute=59, second=59) + timedelta(seconds=1)
    ttl = int((end_of_day - now).total_seconds())
    cache.set(daily_key, daily_count + 1, ttl)

    return otp


def verify_phone_otp(phone: str, otp: str) -> dict:
    """
    Verify an OTP for the given phone.
    Returns {"valid": bool, "error": str|None}
    """
    record = (
        PhoneOTP.objects
        .filter(phone_number=phone, is_verified=False)
        .order_by('-created_at')
        .first()
    )

    if not record:
        return {"valid": False, "error": "No OTP found for this phone number. Please request a new one"}

    if record.expires_at < timezone.now():
        return {"valid": False, "error": "OTP has expired. Please request a new one"}

    if record.attempts >= MAX_VERIFY_ATTEMPTS:
        return {"valid": False, "error": "Too many failed attempts. Please request a new OTP"}

    if record.otp_hash != hash_otp(otp):
        record.attempts += 1
        record.save(update_fields=['attempts'])
        remaining = MAX_VERIFY_ATTEMPTS - record.attempts
        return {"valid": False, "error": f"Invalid OTP. {remaining} attempt(s) remaining"}

    record.is_verified = True
    record.save(update_fields=['is_verified'])
    return {"valid": True, "error": None}
