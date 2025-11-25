import os
from typing import List, Dict
from django.conf import settings


class NotificationConfig:
  @staticmethod
  def is_enabled() -> bool:
    return getattr(settings, 'NOTIFICATION_ENABLED', True)
  @staticmethod
  def get_enabled_channels() -> List[str]:
    channels = getattr(settings, 'NOTIFICATION_CHANNELS', ['email', 'whatsapp', 'dashboard'])
    return [ch.strip().lower() for ch in channels if ch.strip()]
  @staticmethod
  def get_admin_emails() -> List[str]:
    emails = getattr(settings, 'ADMIN_EMAILS', [])
    return [email.strip() for email in emails if email.strip() and '@' in email]
  @staticmethod
  def get_admin_whatsapp_numbers() -> List[str]:
    numbers = getattr(settings, 'ADMIN_WHATSAPP_NUMBERS', [])
    return [num.strip() for num in numbers if num.strip()]
  @staticmethod
  def get_max_retries() -> int:
    return getattr(settings, 'NOTIFICATION_MAX_RETRIES', 3)
    
  @staticmethod
  def get_user_email_delay() -> int:
    return getattr(settings, 'USER_EMAIL_DELAY', 5)
  @staticmethod
  def get_retry_delay() -> int:
    return getattr(settings, 'NOTIFICATION_RETRY_DELAY', 60)
  @staticmethod
  def is_push_enabled() -> bool:
    return getattr(settings, 'PUSH_NOTIFICATION_ENABLED', True)
  @staticmethod
  def get_expo_access_token() -> str:
    return getattr(settings, 'EXPO_ACCESS_TOKEN', None)
  @staticmethod
  def get_push_batch_size() -> int:
    return getattr(settings, 'PUSH_NOTIFICATION_BATCH_SIZE', 100)
  @staticmethod
  def get_push_max_retries() -> int:
    return getattr(settings, 'PUSH_NOTIFICATION_MAX_RETRIES', 3)
  @staticmethod
  def validate_config() -> Dict[str, any]:
    warnings = []
    channels = NotificationConfig.get_enabled_channels()
    if not channels:
      warnings.append("No notification channels enabled")
    if "email" in channels:
      emails = NotificationConfig.get_admin_emails()
      if not emails:
        warnings.append("Email channel enabled but no admin emails configured")
    if "whatsapp" in  channels:
      numbers = NotificationConfig.get_admin_whatsapp_numbers()
      if not numbers:
        warnings.append("WhatsApp channel enabled but no admin numbers configured")
    if "dashboard" in channels:
      if not getattr(settings, 'SUPABASE_URL', None):
        warnings.append("Dashboard channel enabled but SUPABASE_URL not configured")
    if 'push' in channels:
      if not NotificationConfig.is_push_enabled():
        warnings.append("Push channel in NOTIFICATION_CHANNELS but PUSH_NOTIFICATION_ENABLED is false")
      if not NotificationConfig.get_expo_access_token():
        issues.append("Push channel enabled but EXPO_ACCESS_TOKEN not configured")
      batch_size = NotificationConfig.get_push_batch_size()
      if batch_size <= 0 or batch_size > 1000:
        warnings.append(f"Push batch size ({batch_size}) should be between 1 and 1000")
      max_retries = NotificationConfig.get_push_max_retries()
      if max_retries < 0 or max_retries > 10:
        warnings.append(f"Push max retries ({max_retries}) should be between 0 and 10")
      
    return {
      'valid': len(warnings) == 0,
      'warnings': warnings,
      'enabled_channels':channels
      
    }
         
    
    