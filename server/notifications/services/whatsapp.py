import logging
from typing import List, Optional
from django.conf import settings
from django.utils import timezone
from datetime import datetime
from inventory.models import OrderNo

try:
    from twilio.rest import Client as TwilioClient
    from twilio.base.exceptions import TwilioRestException
    TWILIO_AVAILABLE = True
except:
    TWILIO_AVAILABLE = False
    TwilioClient = None
    TwilioRestException = None

logger = logging.getLogger(__name__)


class WhatsappNotification():
    
    def __init__(self):
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
    
    def send_order(self, order_no: OrderNo, recipients: List[str]) -> bool:
        """Send Messages to recipients"""
        if not recipients:
            logger.warning(f"No recipients provided for WhatsApp notification for order {order_no.order_number}")
            return False
        
        message = self._format_whatsapp_message(order_no)
        all_successful = True
        
        logger.info(f"Attempting to send WhatsApp for order {order_no.order_number} to {len(recipients)} recipients.")
        
        for recipient in recipients:
            if not recipient:
                logger.warning(f"Skipping empty recipient number for order {order_no.order_number}.")
                all_successful = False
                continue
            
            try:
                to_number = recipient if recipient.startswith('whatsapp:') else f'whatsapp:{recipient}'
                
                message_obj = self.client.messages.create(
                    body=message,
                    from_=self.from_number,
                    to=to_number
                )
                
                logger.info(f"WhatsApp sent to {recipient}: SID {message_obj.sid}")
                
            except TwilioRestException as e:
                logger.error(f"Twilio API error sending WhatsApp to {recipient} for order {order_no.order_number}: {e.status} - {e.msg}", exc_info=False)
                all_successful = False
            except Exception as e:
                logger.error(f"Failed to send WhatsApp to {recipient}: {str(e)}", exc_info=True)
                all_successful = False
        
        return all_successful
    
    def _format_whatsapp_message(self, order_no) -> str:
        time_ago = self._get_time_ago(order_no.created_at)
        items_count = order_no.orders.count()
        customer_name = order_no.user.name if hasattr(order_no.user, 'name') else order_no.user.email.split('@')[0]
        
        lines = [
            "*New Order Alert*",
            "",
            f"*Order:* #{order_no.order_number}",
            f"*Customer:* {customer_name}",
            f"*Items:* {items_count} product(s)",
            f"*Time:* {time_ago}",
        ]
        
        if order_no.address:
            lines.append(f"*Location:* {order_no.address.city}, {order_no.address.state}")
        
        admin_url = getattr(
            settings,
            'ADMIN_DASHBOARD_URL',
            f"http://api.scrapiz.in/admin/inventory/orderno/{order_no.id}/change/"
        )
        
        short_url = self._generate_short_url(order_no.id, admin_url)
        
        lines.extend([
            "",
            f"View details: {short_url}"
        ])
        
        return "\n".join(lines)
    
    def _get_time_ago(self, dt: datetime) -> str:
        now = timezone.now()
        diff = now - dt
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return "Just Now"
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
        """
        # For MVP, return full URL
        # In production, integrate with bit.ly, TinyURL, or custom shortener
        return full_url
