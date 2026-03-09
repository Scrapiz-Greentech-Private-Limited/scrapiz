# authentication/utils.py
import random
import re
import string
import uuid
import time
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.db import transaction
from authentication.models import User
from user.models import AddressModel
import logging

logger = logging.getLogger(__name__)


def generate_and_send_otp(user):
    otp = str(random.randint(100000, 999999))
    user.otp = otp
    user.otp_expiration = timezone.now() + timedelta(minutes=5)
    user.save(update_fields=["otp", "otp_expiration"])

    send_mail(
        "Your Admin Panel OTP",
        f"Your OTP is {otp}. It will expire in 5 minutes.",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
    )
def generate_referral_code():
  max_attempts = 100
  for _ in range(max_attempts):
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    formatted_code = f"{code[:4]}-{code[4:]}"
    if not User.objects.filter(referral_code=formatted_code).exists():
      return formatted_code
  timestamp = str(int(time.time()))[-4:]
  code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
  return f"{code}-{timestamp}"

def validate_promo_code(code):
  if not code:
    return None
  try:
    referrer = User.objects.get(referral_code=code)
    return referrer
  except User.DoesNotExist:
    return None
    
def link_referral(user, code):
  if not code:
    return None
  referrer = validate_promo_code(code)
  if referrer and referrer.id != user.id:
    user.referred_by = referrer
    user.save(update_fields=['referred_by'])
    return True
  return False
def validate_image(uploaded_file):
  from django.core.exceptions import ValidationError
  max_size = 5 * 1024 * 1024
  if uploaded_file.size > max_size:
    raise ValidationError(
      f"File size exceeds maximum limit of 5MB. Your file is {uploaded_file.size / (1024 * 1024):.2f}MB."
    )
  allowed_mime_types  = ['image/jpeg', 'image/png', 'image/webp']
  content_type = uploaded_file.content_type
  if content_type not in allowed_mime_types:
    raise ValidationError(
       f"Invalid file type. File must be an image (JPEG, PNG, or WebP)."
    )
    
def delete_s3_file(file_url):
  from django.core.files.storage import default_storage
  import logging
  logger = logging.getLogger(__name__)
  if not file_url:
    return False
  try:
    from urllib.parse import urlparse
    parsed_url = urlparse(file_url)
    file_path = parsed_url.path.lstrip('/')
    if default_storage.exists(file_path):
      default_storage.delete(file_path)
      logger.info(f"Successfully deleted file: {file_path}")
      return True
    else:
      logger.warning(f"File not found in storage: {file_path}")
      return False
  except Exception as e:
    logger.error(f"Error deleting file from S3: {str(e)}")
    return False
    
def anonymize_user_account(user):
  anonymous_id = f"deleted_user_{uuid.uuid4().hex[:12]}"
  user.email = f"{anonymous_id}@deleted.local"
  user.name = "Deleted User"
  user.password = "!"
  user.phone_number = None
  if user.profile_image:
    delete_s3_file(user.profile_image)
    user.profile_image = None
  user.otp = None
  user.otp_expiration = None
  user.session_id = None
  user.is_active = False
  user.referral_code = None
  user.referred_by = None
  user.referred_balance = 0
  user.has_completed_first_order = False
  user.is_deleted = True
  user.deleted_at = timezone.now()
  user.save()
  AddressModel.objects.filter(user=user).delete()
  
def send_deletion_confirmation_email(user_email, user_name):
  try:
    deletion_timestamp = timezone.now()
    html_message = render_to_string(
      'email/account_deleted_sucessful.html',
      {
        'name': user_name,
        'deletion_date': deletion_timestamp.strftime('%B %d, %Y'),
        'deletion_time': deletion_timestamp.strftime('%I:%M %p'),
      }
    )
    
    send_mail(
      subject='Account Deletion Confirmed',
      message=f'Your Scrapiz account has been successfully deleted on {deletion_timestamp.strftime("%B %d, %Y at %I:%M %p")}.',
      from_email=settings.EMAIL_HOST_USER,
      recipient_list=[user_email],
      html_message=html_message,
      fail_silently=True
    )
    logger.info(f"Deletion confirmation email sent to {user_email}")
    return True
  except Exception as e:
    logger.error(f"Failed to send deletion confirmation email to {user_email}: {str(e)}")
    return False


def is_valid_e164(phone_number: str) -> bool:
    if not phone_number:
        return False
    e164_pattern = r'^\+[1-9]\d{6,14}$'
    return bool(re.match(e164_pattern, phone_number))


def normalize_phone_number(phone_number: str) -> str:
    if not phone_number:
        raise ValueError("Phone number is required")
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone_number)
    if cleaned.startswith('+'):
        if not is_valid_e164(cleaned):
            raise ValueError(f"Invalid E.164 phone number format: {phone_number}")
        return cleaned
    if cleaned.startswith('00'):
        cleaned = '+' + cleaned[2:]
        if not is_valid_e164(cleaned):
            raise ValueError(f"Invalid phone number format: {phone_number}")
        return cleaned
    raise ValueError(f"Phone number must be in E.164 format (e.g., +919876543210): {phone_number}")
   
  
      
    
    
  