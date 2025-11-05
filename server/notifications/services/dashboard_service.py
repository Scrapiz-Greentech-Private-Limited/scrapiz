"""
Dashboard notification service
Handles creating and managing dashboard notification records in Supabase
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone
from .supabase_client import SupabaseNotificationClient

logger = logging.getLogger(__name__)


class DashboardNotificationService:
    """Handle dashboard notification records in Supabase"""
    
    def __init__(self):
        try:
            self.supabase_client = SupabaseNotificationClient()
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    def create_notification(self, order_no) -> Optional[Dict]:
        """
        Create unread notification record in Supabase
        
        Args:
            order_no: OrderNo model instance
            
        Returns:
            Created notification data or None on failure
        """
        try:
            # Prepare notification data
            data = {
                'order_no_id': order_no.id,
                'order_number': order_no.order_number,
                'notification_type': 'DASHBOARD',
                'status': 'PENDING',
                'recipient': 'admin_dashboard',
                'metadata': {
                    'customer_email': order_no.user.email,
                    'customer_name': order_no.user.name if hasattr(order_no.user, 'name') else order_no.user.email,
                    'items_count': order_no.orders.count(),
                    'created_at': order_no.created_at.isoformat(),
                    'has_address': order_no.address is not None,
                    'has_images': bool(order_no.images),
                    'images_count': len(order_no.images) if order_no.images else 0,
                }
            }
            
            # Create in Supabase
            result = self.supabase_client.create_notification(data)
            
            if result:
                logger.info(f"Dashboard notification created for order {order_no.order_number}")
                return result
            else:
                logger.error(f"Failed to create dashboard notification for order {order_no.order_number}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating dashboard notification: {str(e)}", exc_info=True)
            return None
    
    def mark_as_read(self, notification_id: int, user_id: Optional[int] = None) -> bool:
        """
        Mark notification as read by admin in Supabase
        
        Args:
            notification_id: ID of notification to mark as read
            user_id: Optional user ID who read the notification
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {
                'status': 'READ',
                'read_at': datetime.now(timezone.utc).isoformat()
            }
            
            if user_id:
                if 'metadata' not in update_data:
                    update_data['metadata'] = {}
                update_data['metadata']['read_by_user_id'] = user_id
            
            result = self.supabase_client.update_notification(notification_id, update_data)
            
            if result:
                logger.info(f"Notification {notification_id} marked as read")
                return True
            else:
                logger.warning(f"Failed to mark notification {notification_id} as read")
                return False
                
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}", exc_info=True)
            return False
    
    def get_unread_count(self, user_id: Optional[int] = None) -> int:
        """
        Get count of unread notifications from Supabase
        
        Args:
            user_id: Optional user ID to filter by
            
        Returns:
            Count of unread notifications
        """
        try:
            response = (
                self.supabase_client.client
                .table(self.supabase_client.table)
                .select('id', count='exact')
                .eq('notification_type', 'DASHBOARD')
                .in_('status', ['PENDING', 'SENT'])
                .execute()
            )
            
            count = response.count if hasattr(response, 'count') else 0
            logger.info(f"Unread notification count: {count}")
            return count
            
        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}", exc_info=True)
            return 0
    
    def get_notifications(self, filters: Dict) -> List[Dict]:
        """
        Get filtered list of notifications from Supabase
        
        Args:
            filters: Dictionary of filter parameters
                - status: Filter by status
                - notification_type: Filter by type
                - date_from: Filter by start date
                - date_to: Filter by end date
                - limit: Limit results
                - offset: Offset for pagination
                
        Returns:
            List of notification records
        """
        try:
            notifications = self.supabase_client.query_notifications(filters)
            logger.info(f"Retrieved {len(notifications)} notifications with filters: {filters}")
            return notifications
        except Exception as e:
            logger.error(f"Error getting notifications: {str(e)}", exc_info=True)
            return []
    
    def update_notification_status(self, notification_id: int, status: str, error_message: Optional[str] = None) -> bool:
        """
        Update notification status (PENDING, SENT, FAILED, READ)
        
        Args:
            notification_id: ID of notification
            status: New status value
            error_message: Optional error message if failed
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {'status': status}
            
            if status == 'SENT':
                update_data['sent_at'] = datetime.now(timezone.utc).isoformat()
            
            if status == 'FAILED' and error_message:
                update_data['error_message'] = error_message
            
            result = self.supabase_client.update_notification(notification_id, update_data)
            
            if result:
                logger.info(f"Notification {notification_id} status updated to {status}")
                return True
            else:
                logger.warning(f"Failed to update notification {notification_id} status")
                return False
                
        except Exception as e:
            logger.error(f"Error updating notification status: {str(e)}", exc_info=True)
            return False
