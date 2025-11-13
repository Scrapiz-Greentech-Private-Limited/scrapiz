"""
Notification system configuration helper
Loads and validates notification settings from environment
"""
import os
from typing import List, Dict
from django.conf import settings


class NotificationConfig:
    """Helper class for notification configuration"""
    
    @staticmethod
    def is_enabled() -> bool:
        """Check if notification system is enabled"""
        return getattr(settings, 'NOTIFICATION_ENABLED', True)
    
    @staticmethod
    def get_enabled_channels() -> List[str]:
        """Get list of enabled notification channels"""
        channels = getattr(settings, 'NOTIFICATION_CHANNELS', ['email', 'whatsapp', 'dashboard'])
        return [ch.strip().lower() for ch in channels if ch.strip()]
    
    @staticmethod
    def get_admin_emails() -> List[str]:
        """Get list of admin email addresses"""
        emails = getattr(settings, 'ADMIN_EMAILS', [])
        return [email.strip() for email in emails if email.strip() and '@' in email]
    
    @staticmethod
    def get_admin_whatsapp_numbers() -> List[str]:
        """Get list of admin WhatsApp numbers"""
        numbers = getattr(settings, 'ADMIN_WHATSAPP_NUMBERS', [])
        return [num.strip() for num in numbers if num.strip()]
    
    @staticmethod
    def get_max_retries() -> int:
        """Get maximum retry attempts for failed notifications"""
        return getattr(settings, 'NOTIFICATION_MAX_RETRIES', 3)
    
    @staticmethod
    def get_retry_delay() -> int:
        """Get retry delay in seconds"""
        return getattr(settings, 'NOTIFICATION_RETRY_DELAY', 60)
    
    @staticmethod
    def get_user_email_delay() -> int:
        """Get delay in seconds before sending user confirmation email"""
        return getattr(settings, 'USER_EMAIL_DELAY', 5)
    
    @staticmethod
    def validate_config() -> Dict[str, any]:
        """Validate notification configuration and return status"""
        issues = []
        warnings = []
        
        if not NotificationConfig.is_enabled():
            warnings.append("Notification system is disabled")
        
        channels = NotificationConfig.get_enabled_channels()
        if not channels:
            issues.append("No notification channels enabled")
        
        if 'email' in channels:
            emails = NotificationConfig.get_admin_emails()
            if not emails:
                issues.append("Email channel enabled but no admin emails configured")
            if not getattr(settings, 'EMAIL_HOST_USER', None):
                issues.append("Email channel enabled but EMAIL_HOST_USER not configured")
        
        if 'whatsapp' in channels:
            numbers = NotificationConfig.get_admin_whatsapp_numbers()
            if not numbers:
                issues.append("WhatsApp channel enabled but no admin numbers configured")
            if not getattr(settings, 'TWILIO_ACCOUNT_SID', None):
                issues.append("WhatsApp channel enabled but TWILIO_ACCOUNT_SID not configured")
            if not getattr(settings, 'TWILIO_AUTH_TOKEN', None):
                issues.append("WhatsApp channel enabled but TWILIO_AUTH_TOKEN not configured")
        
        if 'dashboard' in channels:
            if not getattr(settings, 'SUPABASE_URL', None):
                issues.append("Dashboard channel enabled but SUPABASE_URL not configured")
            if not getattr(settings, 'SUPABASE_SERVICE_KEY', None):
                issues.append("Dashboard channel enabled but SUPABASE_SERVICE_KEY not configured")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings,
            'enabled_channels': channels
        }
