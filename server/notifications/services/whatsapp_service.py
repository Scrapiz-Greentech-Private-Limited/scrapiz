"""
WhatsApp notification service
Handles sending WhatsApp messages via Twilio API
"""
import logging
from typing import List, Optional
from django.conf import settings
from django.utils import timezone
from datetime import datetime

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    TwilioClient = None

logger = logging.getLogger(__name__)


class WhatsAppNotificationService:
    """Handle WhatsApp notification delivery via Twilio"""
    
    def __init__(self):
        if not TWILIO_AVAILABLE:
            logger.error("Twilio library not installed. Install with: pip install twilio")
            raise ImportError("twilio library is required")
        
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
        self.from_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', None)
        
        if not account_sid or not auth_token or not self.from_number:
            logger.error("Twilio credentials not configured")
            raise ValueError("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER must be configured")
        
        try:
            self.client = TwilioClient(account_sid, auth_token)
            logger.info("Twilio client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {str(e)}")
            raise
    
    def send_order_whatsapp(self, order_no, recipients: List[str]) -> bool:
        """
        Send WhatsApp message to recipients
        
        Args:
            order_no: OrderNo model instance
            recipients: List of phone numbers (with country code)
            
        Returns:
            True if all messages sent successfully, False otherwise
        """
        if not recipients:
            logger.warning("No recipients provided for WhatsApp notification")
            return False
        
        message = self._format_whatsapp_message(order_no)
        success_count = 0
        
        for recipient in recipients:
            try:
                # Ensure number has whatsapp: prefix
                to_number = recipient if recipient.startswith('whatsapp:') else f'whatsapp:{recipient}'
                
                # Send message
                message_obj = self.client.messages.create(
                    body=message,
                    from_=self.from_number,
                    to=to_number
                )
                
                logger.info(f"WhatsApp sent to {recipient}: SID {message_obj.sid}")
                success_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send WhatsApp to {recipient}: {str(e)}", exc_info=True)
        
        return success_count == len(recipients)
    
    def _format_whatsapp_message(self, order_no) -> str:
        """
        Generate concise WhatsApp message
        
        Args:
            order_no: OrderNo model instance
            
        Returns:
            Formatted WhatsApp message string
        """
        # Calculate time ago
        time_ago = self._get_time_ago(order_no.created_at)
        
        # Count items
        items_count = order_no.orders.count()
        
        # Get customer name
        customer_name = order_no.user.name if hasattr(order_no.user, 'name') else order_no.user.email.split('@')[0]
        
        # Build message
        lines = [
            "🛒 *New Order Alert*",
            "",
            f"*Order:* #{order_no.order_number}",
            f"*Customer:* {customer_name}",
            f"*Items:* {items_count} product(s)",
            f"*Time:* {time_ago}",
        ]
        
        # Add address if available
        if order_no.address:
            lines.append(f"*Location:* {order_no.address.city}, {order_no.address.state}")
        
        # Add view link
        admin_url = getattr(
            settings,
            'ADMIN_DASHBOARD_URL',
            f"http://localhost:8000/admin/inventory/orderno/{order_no.id}/change/"
        )
        short_url = self._generate_short_url(order_no.id, admin_url)
        lines.extend([
            "",
            f"View details: {short_url}",
        ])
        
        return "\n".join(lines)
    
    def _get_time_ago(self, dt: datetime) -> str:
        """
        Get human-readable time ago string
        
        Args:
            dt: Datetime object
            
        Returns:
            Time ago string (e.g., "5 minutes ago")
        """
        now = timezone.now()
        diff = now - dt
        
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return "just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        else:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days != 1 else ''} ago"
    
    def _generate_short_url(self, order_id: int, full_url: str) -> str:
        """
        Create shortened URL for order details
        For MVP, returns full URL. Can integrate URL shortener service later.
        
        Args:
            order_id: Order ID
            full_url: Full admin URL
            
        Returns:
            URL string
        """
        # For MVP, return full URL
        # In production, integrate with bit.ly, TinyURL, or custom shortener
        return full_url
