import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone
from .client import ClientService, SUPABASE_AVAILABLE

from inventory.models import OrderNo


logger = logging.getLogger(__name__)



class DashboardNotification:
    def __init__(self):
      try:
        self.client = ClientService()
      except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        raise
        
    def create_notification(self, order_no:OrderNo) -> Optional[Dict]:
      try:
        data = {
                'order_id': order_no.id,
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
        result = self.client.create_notification(data)
        if result:
          logger.info("Dashboard notification created for order {order_no.order_number}")
          return result
        else:
          logger.error(f"Failed to create dashboard notification for order {order_no.order_number}")
          return None
      except Exception as e:
        logger.error(f"Error creating dashboard notification: {str(e)}", exc_info=True)
        return None
        
    def mark_as_read(self, notification_id: int, user_id: Optional[int] = None) -> bool:
      try:
        update_data = {
                'status': 'READ',
                'read_at': datetime.now(timezone.utc).isoformat()
        }
        if user_id:
          if 'metadata' not in update_data:
              update_data['metadata'] = {}
          update_data['metadata']['read_by_user_id'] = user_id
        result = self.client.update_notification(notification_id, update_data)
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
      try:
        filters = {
        'notification_type': 'DASHBOARD',
        }
        pending_list = self.client.query_notifications({**filters, 'status': 'PENDING'})
        sent_list = self.client.query_notifications({**filters, 'status': 'SENT'})
        logger.debug(f"Calculated unread notification count: {count}")
        return count
      except Exception as e:
        logger.error(f"Error getting unread notification count: {str(e)}", exc_info=True)
        return 0
        
    def get_notifications(self, filters: Dict) -> List[Dict]:
      try:
        if 'notification_type' not in filters:
          filters['notification_type'] = 'DASHBOARD'
        notifications = self.client.query_notifications(filters)
        logger.info(f"Retrieved {len(notifications)} notifications with filters: {filters}")
        return notifications
      except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}", exc_info=True)
        return []
        
    def update_notification_status(self, notification_id: int, status: str, error_message: Optional[str] = None) -> bool:
      try:
        update_data = {'status': status}
        if status == 'SENT':
          update_data['sent_at'] = datetime.now(timezone.utc).isoformat()
        if status == 'FAILED' and error_message:
          update_data['error_message'] = error_message
        result = self.client.update_notification(notification_id, update_data)
        if result:
          logger.info(f"Notification {notification_id} status updated to {status}")
          return True
        else:
          logger.warning(f"Failed to update notification {notification_id} status")
          return False
      except Exception as e:
        logger.error(f"Error updating notification status: {str(e)}", exc_info=True)
        return False
          
    