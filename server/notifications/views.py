import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .services.dashboard import DashboardNotification
from .services.manager import NotificationManager
from .config import NotificationConfig



logger = logging.getLogger(__name__)


class NotificationListAPIView(APIView):
  def get(self,request):
    try:
      service = DashboardNotification()
      filters = {
                'status': request.GET.get('status'),
                'notification_type': request.GET.get('notification_type'),
                'date_from': request.GET.get('date_from'),
                'date_to': request.GET.get('date_to'),
                'limit': int(request.GET.get('limit', 20)),
                'offset': int(request.GET.get('offset', 0))
      }
      filters = {k: v for k, v in filters.items() if v is not None}
      notifications = service.get_notifications(filters)
      return Response({
                'success': True,
                'count': len(notifications),
                'notifications': notifications
      }, status=status.HTTP_200_OK)
    except Exception as e:
      logger.error(f"Error listing notifications: {str(e)}", exc_info=True)
      return Response({
                'success': False,
                'error': str(e)
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NotificationDetailAPIView(APIView):
  def get(self, request, pk):
    try:
      service = DashboardNotification()
      notification = service.client.get_notification(pk)
      if notification:
        return Response({
        'success':True,
        'notification':notification
        
        }, status=status.HTTP_200_OK)
      else:
        return Respone({
        'success': False,
        'error': 'Notification not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
      logger.error(f"Error getting notification {pk}: {str(e)}", exc_info=True)
      return Response({
                'success': False,
                'error': str(e)
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      
class MarkNotificationReadAPIView(APIView):
  def post(self , request , pk):
    try:
      service = DashboardNotification()
      user_id=  request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
      success = service.mark_as_read(pk, user_id)
      if success:
        return Response({
        'success': True,
        'message': 'Notification marked as read'
        }, status=status.HTTP_200_OK)
      else:
        return Response({
                    'success': False,
                    'error': 'Failed to update notification'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
      logger.error(f"Error marking notification {pk} as read: {str(e)}", exc_info=True)
      return Response({
                'success': False,
                'error': str(e)
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class RetryNotificationAPIView(APIView):
  def post(self , request , pk):
    try:
      manager = NotificationManager()
      success = manager.retry_failed_notification(pk)
      if success:
        return Response({
                    'success': True,
                    'message': 'Notification retry initiated successfully'
        }, status=status.HTTP_200_OK)
      else:
        return Response({
                    'success': False,
                    'error': 'Failed to retry notification'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
      logger.error(f"Error retrying notification {pk}: {str(e)}", exc_info=True)
      return Response({
                'success': False,
                'error': str(e)
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UnreadCountAPIView(APIView):
  def get(self, request):
    try:
      service = DashboardNotification()
      user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
      count = service.get_unread_count(user_id)
      return Response({
                'success': True,
                'unread_count': count
      }, status=status.HTTP_200_OK)
    except Exception as e:
      logger.error(f"Error getting unread count: {str(e)}", exc_info=True)
      return Response({
                'success': False,
                'error': str(e)
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    

  
