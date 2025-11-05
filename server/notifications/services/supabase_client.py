"""
Supabase client wrapper for notification operations
Provides clean interface for interacting with order_notifications table
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone
from django.conf import settings

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None

logger = logging.getLogger(__name__)


class SupabaseNotificationClient:
    """Client for interacting with Supabase notifications table"""
    
    def __init__(self):
        if not SUPABASE_AVAILABLE:
            logger.error("Supabase library not installed. Install with: pip install supabase")
            raise ImportError("supabase library is required")
        
        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        supabase_key = getattr(settings, 'SUPABASE_SERVICE_KEY', None)
        
        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be configured")
            raise ValueError("Supabase configuration missing")
        
        try:
            self.client: Client = create_client(supabase_url, supabase_key)
            self.table = 'order_notifications'
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    def create_notification(self, data: Dict) -> Optional[Dict]:
        """
        Insert new notification record
        
        Args:
            data: Notification data dictionary
            
        Returns:
            Created notification record or None on failure
        """
        try:
            response = self.client.table(self.table).insert(data).execute()
            if response.data and len(response.data) > 0:
                logger.info(f"Created notification: {response.data[0].get('id')}")
                return response.data[0]
            logger.warning("Notification created but no data returned")
            return None
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}", exc_info=True)
            return None
    
    def update_notification(self, notification_id: int, data: Dict) -> Optional[Dict]:
        """
        Update existing notification
        
        Args:
            notification_id: ID of notification to update
            data: Update data dictionary
            
        Returns:
            Updated notification record or None on failure
        """
        try:
            response = (
                self.client.table(self.table)
                .update(data)
                .eq('id', notification_id)
                .execute()
            )
            if response.data and len(response.data) > 0:
                logger.info(f"Updated notification {notification_id}")
                return response.data[0]
            logger.warning(f"Notification {notification_id} not found for update")
            return None
        except Exception as e:
            logger.error(f"Failed to update notification {notification_id}: {str(e)}", exc_info=True)
            return None
    
    def get_notification(self, notification_id: int) -> Optional[Dict]:
        """
        Get single notification by ID
        
        Args:
            notification_id: ID of notification to retrieve
            
        Returns:
            Notification record or None if not found
        """
        try:
            response = (
                self.client.table(self.table)
                .select('*')
                .eq('id', notification_id)
                .execute()
            )
            if response.data and len(response.data) > 0:
                return response.data[0]
            logger.warning(f"Notification {notification_id} not found")
            return None
        except Exception as e:
            logger.error(f"Failed to get notification {notification_id}: {str(e)}", exc_info=True)
            return None
    
    def query_notifications(self, filters: Dict) -> List[Dict]:
        """
        Query notifications with filters
        
        Args:
            filters: Dictionary of filter parameters
            
        Returns:
            List of notification records
        """
        try:
            query = self.client.table(self.table).select('*')
            
            # Apply filters
            if filters.get('status'):
                query = query.eq('status', filters['status'])
            
            if filters.get('notification_type'):
                query = query.eq('notification_type', filters['notification_type'])
            
            if filters.get('order_no_id'):
                query = query.eq('order_no_id', filters['order_no_id'])
            
            if filters.get('date_from'):
                query = query.gte('created_at', filters['date_from'])
            
            if filters.get('date_to'):
                query = query.lte('created_at', filters['date_to'])
            
            # Ordering
            query = query.order('created_at', desc=True)
            
            # Pagination
            if filters.get('limit'):
                limit = filters['limit']
                offset = filters.get('offset', 0)
                query = query.range(offset, offset + limit - 1)
            
            response = query.execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Failed to query notifications: {str(e)}", exc_info=True)
            return []
    
    def get_failed_notifications(self, max_retries: int = 3) -> List[Dict]:
        """
        Get failed notifications that can be retried
        
        Args:
            max_retries: Maximum retry count threshold
            
        Returns:
            List of failed notification records
        """
        try:
            response = (
                self.client.table(self.table)
                .select('*')
                .eq('status', 'FAILED')
                .lt('retry_count', max_retries)
                .order('created_at', desc=True)
                .execute()
            )
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Failed to get failed notifications: {str(e)}", exc_info=True)
            return []
