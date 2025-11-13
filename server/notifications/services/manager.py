import logging
from typing import Dict, List
from django.conf import settings
from .email import EmailNotificationService
from .whatsapp import WhatsappNotification
from .dashboard import DashboardNotification
from ..config import NotificationConfig
from ..tasks import send_user_confirmation_email_task
from inventory.models import OrderNo

logger = logging.getLogger(__name__)


class NotificationManager:
    
    def __init__(self):
        self.config = NotificationConfig()
        self.channels = self.config.get_enabled_channels()
        
        self.email = None
        self.whatsapp = None
        self.dashboard = None
        
        if 'email' in self.channels:
            try:
                self.email = EmailNotificationService()
                logger.info("Email service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize email service: {str(e)}")
        
        if 'whatsapp' in self.channels:
            try:
                self.whatsapp = WhatsappNotification()
                logger.info("WhatsApp service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize WhatsApp service: {str(e)}")
        
        if 'dashboard' in self.channels:
            try:
                self.dashboard = DashboardNotification()
                logger.info("Dashboard service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize dashboard service: {str(e)}")
    
    def send_order_notifications(self, order_id: int) -> Dict[str, bool]:
        """Send notifications for a new order across all enabled channels"""
        results = {
            'email': False,
            'whatsapp': False,
            'dashboard': False,
            'user_email_scheduled': False,
            'overall_success': False
        }
        
        try:
            order_no = OrderNo.objects.select_related(
                'user', 'status', 'address'
            ).prefetch_related(
                'orders__product__category'
            ).get(id=order_id)
            
            logger.info(f"Processing notifications for order {order_no.order_number}")
            
            if "email" in self.channels and self.email:
                results['email'] = self.email_notification(order_no)
            
            if 'whatsapp' in self.channels and self.whatsapp:
                results['whatsapp'] = self.whatsapp_notification(order_no)
            
            if 'dashboard' in self.channels and self.dashboard:
                results['dashboard'] = self.dashboard_notification(order_no)
            try:
              delay_seconds = self.config.get_user_email_delay()
              send_user_confirmation_email_task.apply_async(
                args=[order_id],
                countdown=delay_seconds
              )
              results['user_email_scheduled'] = True
              logger.info(f"User confirmation email scheduled for order {order_no.order_number} ({delay_seconds}s delay)")
            except Exception as e:
              logger.error(f"Failed to schedule user confirmation email: {str(e)}", exc_info=True)
              results['user_email_scheduled'] = False
              
            results['overall_success'] = any([
                results['email'],
                results['whatsapp'],
                results['dashboard'],
                results['user_email_scheduled']
            ])
            
            logger.info(f"Notification results for order {order_no.order_number}: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Error sending notifications for order {order_id}: {str(e)}", exc_info=True)
            return results
    
    def email_notification(self, order_no) -> bool:
        admin_emails = self.config.get_admin_emails()
        if not admin_emails:
            logger.warning("No admin emails configured, skipping email notification")
            return False
        
        if not isinstance(self.email, EmailNotificationService):
            logger.error(f"Email service not properly initialized for order {order_no.order_number}.")
            return False
        
        success = self.email.send_order_email(order_no, admin_emails)
        
        if success:
            logger.info(f"Email notification sent for order {order_no.order_number}")
        else:
            logger.error(f"Failed to send email notification for order {order_no.order_number}")
        
        return success
    
    def whatsapp_notification(self, order_no) -> bool:
        admin_numbers = self.config.get_admin_whatsapp_numbers()
        if not admin_numbers:
            logger.warning("No admin WhatsApp numbers configured, skipping WhatsApp notification")
            return False
        
        if not isinstance(self.whatsapp, WhatsappNotification):
            logger.error(f"WhatsApp service not properly initialized for order {order_no.order_number}.")
            return False
        
        success = self.whatsapp.send_order(order_no, admin_numbers)
        
        if success:
            logger.info(f"WhatsApp notification sent for order {order_no.order_number}")
        else:
            logger.error(f"Failed to send WhatsApp notification for order {order_no.order_number}")
        
        return success
    
    def dashboard_notification(self, order_no) -> bool:
        if not isinstance(self.dashboard, DashboardNotification):
            logger.error(f"Dashboard service not properly initialized for order {order_no.order_number}.")
            return False
        
        try:
            result = self.dashboard.create_notification(order_no)
            if result:
                logger.info(f"Dashboard notification created for order {order_no.order_number}")
                return True
            else:
                logger.error(f"Failed to create dashboard notification for order {order_no.order_number}")
                return False
        except Exception as e:
            logger.error(f"Error in dashboard notification: {str(e)}", exc_info=True)
            return False
    
    def retry_failed_notification(self, notification_id: int) -> bool:
        """Retry a failed notification"""
        try:
            notification = self.dashboard.supabase_client.get_notification(notification_id)
            if not notification:
                logger.error(f"Notification {notification_id} not found")
                return False
            
            order_no = OrderNo.objects.get(id=notification['order_no_id'])
            notification_type = notification['notification_type'].lower()
            success = False
            
            if notification_type == 'email' and self.email:
                admin_emails = self.config.get_admin_emails()
                success = self.email.send_order_email(order_no, admin_emails)
            elif notification_type == 'whatsapp' and self.whatsapp:
                admin_numbers = self.config.get_admin_whatsapp_numbers()
                success = self.whatsapp.send_order(order_no, admin_numbers)
            elif notification_type == 'dashboard' and self.dashboard:
                result = self.dashboard.create_notification(order_no)
                success = result is not None
            
            if success:
                self.dashboard.update_notification_status(notification_id, 'SENT')
                logger.info(f"Successfully retried notification {notification_id}")
            else:
                retry_count = notification.get('retry_count', 0) + 1
                self.dashboard.supabase_client.update_notification(
                    notification_id,
                    {'retry_count': retry_count}
                )
                logger.error(f"Failed to retry notification {notification_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error retrying notification {notification_id}: {str(e)}", exc_info=True)
            return False
