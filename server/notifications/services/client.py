import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone
from django.conf import settings




try:
  from supabase import create_client, Client
  SUPABASE_AVAILABLE =True
except ImportError:
  SUPABASE_AVAILABLE = False
logger = logging.getLogger(__name__)


class ClientService():

   '''Client for interacting with Supabase'''
   def __init__(self):
     supabase_url = getattr(settings, 'SUPABASE_URL', None)
     supabase_key = getattr(settings, 'SUPABASE_SERVICE_KEY', None)
     if not supabase_url or not supabase_key:
       logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be configured")
     try:
       self.client:Client = create_client(supabase_url, supabase_key)
       self.table = "order_notifications"
       logger.info("Supabase client initialized successfully")
     except Exception as e:
       logger.error(f"Failed to initialize Supabase client: {str(e)}")
       raise e
       
   def create_notification(self ,data:Dict) -> Optional[Dict]:
     ''' Insert new notification record'''
     try:
       response =  self.client.table(self.table).insert(data).execute()
       if response.data:
         logger.info(f"Created notification: {response.data[0].get('id')}")
         return response.data[0]
       logger.warning("Notification created but no data returned")
       return None
     except Exception as e:
       logger.erro(f"Failed to create notification: {str(e)}", exc_info=True)
       return None
      
   def update_notification(self , notification_id: int, data:Dict ) -> Optional[Dict]:
     '''Update Existing notification'''
     try:
       response = (self.client.table(self.table).update(data).eq('id', notification_id).execute())
       if response.data:
         logger.info(f"Updated notification {notification_id}")
         return response.data[0]
       logger.warning(f"Notification {notification_id} not found for update")
       return None
     except Exception as e:
       logger.error(f"Failed to update notification {notification_id}: {str(e)}", exc_info=True)
       raise e
      
   def get_notification(self, notification_id: int) -> Optional[Dict]:
     try:
       response = (self.client.table(self.table).select('*').eq('id', notification_id).execute())
       if response.data:
         return response.data[0]
       logger.warning(f"Notification {notification_id} not found")
       return None
     except Exception as e:
       logger.err(f"Failed to get notification {notification_id}: {str(e)}", exc_info=True)
       return None
   def query_notifications(self, filters: Dict) -> List[Dict]:
     try:
       query = self.client.table(self.table).select('*')
       if filters.get('status'):
         query = query.eq('status', filters['status'])
       if filters.get('notification_type'):
         query = query.eq('notification_type', filters['notification_type'])  
       if filters.get('order_id'):
         query = query.eq('order_id', filters['order_id'])
       if filters.get('date_from'):
         query = query.eq('date_from', filters['date_from'])
       if filters.get('date_to'):
         query = query.gte('created_at', filters['date_to'])
       query = query.order('created_at', desc=True)
       if filters.get('limit'):
         limit = filters['limit']
         offset = filters.get('offset', 0)
         query = query.range(offset, offset + limit - 1)
       response = query.execute()
       return response.data if response.data else []
     except Exception as e:
       logger.error(f"Failed to query notifications: {str(e)}", exc_info=True)
       return None
      
   def get_failed_notifications(self, max_retries: int = 3) -> List[Dict]:
     try:
       response = (self.client.table(self.table).select('*').eq('status', 'FAILED').lt('retry_count', max_retries).order('created_at', desc=True).execute())
       return response.data if response.data else []
     except Exception as e:
       logger.error(f"Failed to get failed notifications: {str(e)}", exc_info=True)