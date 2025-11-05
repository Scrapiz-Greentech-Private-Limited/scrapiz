"""
Notification Manager - Central orchestrator for all notification channels
Coordinates email, WhatsApp, and dashboard notifications
"""
import logging
from typing import Dict, List
from django.conf import settings
from .email_service import EmailNotificationService
from .whatsapp_service import WhatsAppNotificationService
from .dashboard_service import DashboardNotificationService
from ..config import NotificationConfig

logger = logging.getLogger(__name__)


class NotificationManager:
    """Central service for managing order notifications"""
    
    def __init__(self):
        self.config = NotificationConfig()
        self.enabled_channels = self.config.get_enabled_channels()
        
        # Initialize services based on enabled channels
        self.email_service = None
        self.whatsapp_service = None
        self.dashboard_service = None
        
        if 'email' in self.enabled_channels:
            try:
                self.email_service = EmailNotificationService()
                logger.info("Email service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize email service: {str(e)}")
        
        if 'whatsapp' in self.enabled_channels:
            try:
                self.whatsapp_service = WhatsAppNotificationService()
                logger.info("WhatsApp service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize WhatsApp service: {str(e)}")
        
        if 'dashboard' in self.enabled_channels:
            try:
                self.dashboard_service = DashboardNotificationService()
                logger.info("Dashboard service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize dashboard service: {str(e)}")
    
    def send_order_notifications(self, order_no_id: int) -> Dict[str, bool]:
        """
        Send notifications through all enabled channels
        
        Args:
            order_no_id: ID of the OrderNo instance
            
        Returns:
            Dictionary with channel names and success status
        """
        # Import here to avoid circular imports
        from inventory.models import OrderNo
        
        results = {
            'email': False,
            'whatsapp': False,
            'dashboard': False,
            'overall_success': False
        }
        
        try:
            # Fetch order with related data
            order_no = OrderNo.objects.select_related(
                'user', 'status', 'address'
            ).prefetch_related('orders__product__category').get(id=order_no_id)
            
            logger.info(f"Processing notifications for order {order_no.order_number}")
            
            # Send through each enabled channel
            if 'email' in self.enabled_channels and self.email_service:
                results['email'] = self._send_email_notification(order_no)
            
            if 'whatsapp' in self.enabled_channels and self.whatsapp_service:
                results['whatsapp'] = self._send_whatsapp_notification(order_no)
            
            if 'dashboard' in self.enabled_channels and self.dashboard_service:
                results['dashboard'] = self._create_dashboard_notification(order_no)
            
            # Overall success if at least one channel succeeded
            results['overall_success'] = any([
                results['email'],
                results['whatsapp'],
                results['dashboard']
            ])
            
            logger.info(f"Notification results for order {order_no.order_number}: {results}")
            return results
            
        except OrderNo.DoesNotExist:
            logger.error(f"Order with ID {order_no_id} not found")
            return results
        except Exception as e:
            logger.error(f"Error sending notifications for order {order_no_id}: {str(e)}", exc_info=True)
            return results
    
    def _send_email_notification(self, order_no) -> bool:
        """
        Send email to all configured admin emails
        
        Args:
            order_no: OrderNo model instance
            
        Returns:
            True if successful, False otherwise
        """
        try:
            admin_emails = self.config.get_admin_emails()
            
            if not admin_emails:
                logger.warning("No admin emails configured, skipping email notification")
                return False
            
            success = self.email_service.send_order_email(order_no, admin_emails)
            
            if success:
                logger.info(f"Email notification sent for order {order_no.order_number}")
            else:
                logger.error(f"Failed to send email notification for order {order_no.order_number}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error in email notification: {str(e)}", exc_info=True)
            return False
    
    def _send_whatsapp_notification(self, order_no) -> bool:
        """
        Send WhatsApp message to all configured admin numbers
        
        Args:
            order_no: OrderNo model instance
            
        Returns:
            True if successful, False otherwise
        """
        try:
            admin_numbers = self.config.get_admin_whatsapp_numbers()
            
            if not admin_numbers:
                logger.warning("No admin WhatsApp numbers configured, skipping WhatsApp notification")
                return False
            
            success = self.whatsapp_service.send_order_whatsapp(order_no, admin_numbers)
            
            if success:
                logger.info(f"WhatsApp notification sent for order {order_no.order_number}")
            else:
                logger.error(f"Failed to send WhatsApp notification for order {order_no.order_number}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error in WhatsApp notification: {str(e)}", exc_info=True)
            return False
    
    def _create_dashboard_notification(self, order_no) -> bool:
        """
        Create notification record in Supabase for dashboard display
        
        Args:
            order_no: OrderNo model instance
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.dashboard_service.create_notification(order_no)
            
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
        """
        Manually retry a failed notification from Supabase
        
        Args:
            notification_id: ID of the notification to retry
            
        Returns:
            True if retry successful, False otherwise
        """
        try:
            if not self.dashboard_service:
                logger.error("Dashboard service not initialized")
                return False
            
            # Get notification details
            notification = self.dashboard_service.supabase_client.get_notification(notification_id)
            
            if not notification:
                logger.error(f"Notification {notification_id} not found")
                return False
            
            # Get order
            from inventory.models import OrderNo
            order_no = OrderNo.objects.get(id=notification['order_no_id'])
            
            # Retry based on notification type
            notification_type = notification['notification_type'].lower()
            success = False
            
            if notification_type == 'email' and self.email_service:
                admin_emails = self.config.get_admin_emails()
                success = self.email_service.send_order_email(order_no, admin_emails)
            
            elif notification_type == 'whatsapp' and self.whatsapp_service:
                admin_numbers = self.config.get_admin_whatsapp_numbers()
                success = self.whatsapp_service.send_order_whatsapp(order_no, admin_numbers)
            
            elif notification_type == 'dashboard' and self.dashboard_service:
                result = self.dashboard_service.create_notification(order_no)
                success = result is not None
            
            # Update notification status
            if success:
                self.dashboard_service.update_notification_status(notification_id, 'SENT')
                logger.info(f"Successfully retried notification {notification_id}")
            else:
                # Increment retry count
                retry_count = notification.get('retry_count', 0) + 1
                self.dashboard_service.supabase_client.update_notification(
                    notification_id,
                    {
                        'retry_count': retry_count,
                        'last_retry_at': self.dashboard_service.supabase_client.client.postgrest.now()
                    }
                )
                logger.error(f"Failed to retry notification {notification_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error retrying notification {notification_id}: {str(e)}", exc_info=True)
            return False
