"""
API views for notification management
Provides endpoints for listing, viewing, and managing notifications
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .services.dashboard_service import DashboardNotificationService
from .services.notification_manager import NotificationManager
from .config import NotificationConfig

logger = logging.getLogger(__name__)


class NotificationListAPIView(APIView):
    """
    List notifications with filtering from Supabase
    
    GET /api/notifications/
    Query params: status, notification_type, date_from, date_to, limit, offset
    """
    
    def get(self, request):
        try:
            service = DashboardNotificationService()
            
            # Build filters from query params
            filters = {
                'status': request.GET.get('status'),
                'notification_type': request.GET.get('notification_type'),
                'date_from': request.GET.get('date_from'),
                'date_to': request.GET.get('date_to'),
                'limit': int(request.GET.get('limit', 20)),
                'offset': int(request.GET.get('offset', 0))
            }
            
            # Remove None values
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
    """
    Get single notification details from Supabase
    
    GET /api/notifications/<id>/
    """
    
    def get(self, request, pk):
        try:
            service = DashboardNotificationService()
            notification = service.supabase_client.get_notification(pk)
            
            if notification:
                return Response({
                    'success': True,
                    'notification': notification
                }, status=status.HTTP_200_OK)
            else:
                return Response({
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
    """
    Mark notification as read in Supabase
    
    POST /api/notifications/<id>/mark-read/
    """
    
    def post(self, request, pk):
        try:
            service = DashboardNotificationService()
            
            # Get user ID if authenticated
            user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
            
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
    """
    Manually retry failed notification
    
    POST /api/notifications/<id>/retry/
    """
    
    def post(self, request, pk):
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
    """
    Get count of unread notifications from Supabase
    
    GET /api/notifications/unread-count/
    """
    
    def get(self, request):
        try:
            service = DashboardNotificationService()
            
            # Get user ID if authenticated
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


class NotificationHealthAPIView(APIView):
    """
    Health check endpoint for notification system
    
    GET /api/notifications/health/
    """
    
    def get(self, request):
        try:
            # Validate configuration
            validation = NotificationConfig.validate_config()
            
            # Check Celery (basic check)
            celery_status = 'unknown'
            try:
                from server.celery import app
                celery_status = 'configured'
            except Exception:
                celery_status = 'not_configured'
            
            # Get pending notifications count
            pending_count = 0
            try:
                service = DashboardNotificationService()
                filters = {'status': 'PENDING', 'limit': 1}
                pending_notifications = service.get_notifications(filters)
                pending_count = len(pending_notifications)
            except Exception:
                pass
            
            health_data = {
                'status': 'healthy' if validation['valid'] else 'unhealthy',
                'notification_enabled': NotificationConfig.is_enabled(),
                'enabled_channels': validation['enabled_channels'],
                'celery_status': celery_status,
                'pending_notifications': pending_count,
                'configuration_valid': validation['valid'],
                'issues': validation['issues'],
                'warnings': validation['warnings']
            }
            
            return Response(health_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in health check: {str(e)}", exc_info=True)
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TestNotificationAPIView(APIView):
    """
    Test notification system by sending a test notification
    
    POST /api/notifications/test/
    Body: {
        "order_no_id": 1
    }
    """
    
    def post(self, request):
        try:
            order_no_id = request.data.get('order_no_id')
            
            if not order_no_id:
                return Response({
                    'success': False,
                    'error': 'order_no_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Trigger notification task
            from .tasks import send_order_notifications_task
            
            # Send async
            task = send_order_notifications_task.delay(order_no_id)
            
            return Response({
                'success': True,
                'message': 'Test notification task initiated',
                'task_id': task.id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error testing notification: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
